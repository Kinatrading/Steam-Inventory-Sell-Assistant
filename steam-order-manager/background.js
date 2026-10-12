import {DEFAULT_CONFIG, validateConfig, reconcileRow} from './core.js';
import {steamOperation} from './steam.js';

const ALARM = 'order-refresh', CONTINUE = 'order-continue';
let running = false;
let controlBusy = false, stopGeneration = 0, haltRequested = false;
const load = async () => ({...DEFAULT_CONFIG, ...(await chrome.storage.local.get('config')).config});
const runtime = async () => (await chrome.storage.local.get('runtime')).runtime || {rows: {}, pending: {}, cursor: 0};
async function patchRuntime(patch) {const state = await runtime(); await chrome.storage.local.set({runtime: {...state, ...patch}});}
async function schedule() {
  const config = await load(), alarm = await chrome.alarms.get(ALARM);
  if (!config.enabled) {await chrome.alarms.clear(ALARM); await chrome.alarms.clear(CONTINUE); return;}
  if (!alarm || alarm.periodInMinutes !== config.interval) await chrome.alarms.create(ALARM, {delayInMinutes: config.interval, periodInMinutes: config.interval});
}

async function cycle() {
  if (running) return;
  running = true;
  const started = Date.now();
  try {
    const config = await load(), previous = await runtime();
    if (haltRequested || !config.enabled || previous.cooldownUntil > Date.now()) return;
    await patchRuntime({busy: true, error: null});
    const auth = {account: config.account, currency: config.currency};
    if (!auth.account) throw new Error('Не прив’язаний Steam-акаунт.');
    let snapshot = await steamOperation('snapshot', auth);
    const rows = config.rows.filter(r => r.active);
    let cursor = previous.cursor < rows.length ? previous.cursor : 0;
    for (; cursor < rows.length; cursor++) {
      if (haltRequested || !(await load()).enabled) break;
      if (Date.now() - started > 150000) {
        await patchRuntime({cursor});
        await chrome.alarms.create(CONTINUE, {delayInMinutes: 1});
        return;
      }
      const row = rows[cursor];
      const report = async result => {const rt = await runtime(); await patchRuntime({rows: {...rt.rows, [row.id]: {...result, checked: Date.now()}}});};
      const journal = {
        get: async id => (await runtime()).pending[id],
        set: async (id, intent) => {const rt = await runtime(); await patchRuntime({pending: {...rt.pending, [id]: intent}});},
        clear: async id => {const rt = await runtime(); delete rt.pending[id]; await patchRuntime({pending: rt.pending});}
      };
      try {
        await reconcileRow({row, snapshot, threshold: config.threshold, journal, report,
          allowed: async () => {const current = await load(); return !haltRequested && current.enabled && current.account === auth.account && current.currency === auth.currency;},
          api: {
            cancel: id => steamOperation('cancel', {...auth, row, orderId: id}),
            create: (item, total) => steamOperation('create', {...auth, row: item, total}),
            snapshot: () => steamOperation('snapshot', auth)
          }
        });
      } catch (error) {
        await report({status: error.message, remaining: null});
        if (/429|HTTP|Увійди|акаунт|валюта|список|формат/.test(error.message)) throw error;
      }
      await patchRuntime({cursor: cursor + 1});
      // Keep requests sequential, with fresh state after every possible mutation.
      if (!haltRequested && (await load()).enabled && cursor + 1 < rows.length) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        snapshot = await steamOperation('snapshot', auth);
      }
    }
    await patchRuntime({cursor: 0, lastCheck: Date.now()});
  } catch (error) {
    await patchRuntime({error: error.message, ...(error.message.includes('429') ? {cooldownUntil: Date.now() + 20 * 60000} : {})});
  } finally {await patchRuntime({busy: false}); running = false;}
}

chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL('dashboard.html');
  const tabs = await chrome.tabs.query({url});
  if (tabs[0]) await chrome.tabs.update(tabs[0].id, {active: true});
  else await chrome.tabs.create({url});
});
chrome.alarms.onAlarm.addListener(alarm => {if ([ALARM, CONTINUE].includes(alarm.name)) void cycle();});
chrome.runtime.onInstalled.addListener(() => {void schedule();});
chrome.runtime.onStartup.addListener(() => {void schedule();});
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || sender.url !== chrome.runtime.getURL('dashboard.html')) return;
  (async () => {
    if (message.type === 'state') return {config: await load(), runtime: await runtime()};
    if (message.type === 'check') {void cycle(); return {};}
    if (message.type === 'stop') {
      stopGeneration++;
      haltRequested = true;
      await chrome.storage.local.set({config: {...await load(), enabled: false}});
      await schedule(); return {};
    }
    if (['save', 'start', 'unlock'].includes(message.type)) {
      if (controlBusy) throw new Error('Попередня дія ще виконується.');
      controlBusy = true;
      try {
        if (message.type === 'save') {
          const generation = stopGeneration;
          if (running) throw new Error('Дочекайся завершення поточної перевірки. Автооновлення можна вимкнути зараз.');
          const old = await load(), config = {...old, ...validateConfig(message.config)};
          const pending = (await runtime()).pending;
          for (const id of Object.keys(pending)) {
            const before = old.rows.find(row => row.id === id), after = config.rows.find(row => row.id === id);
            if (!after || JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Спочатку перевір і розблокуй незавершену операцію перед зміною цього рядка.');
          }
          if (generation !== stopGeneration) config.enabled = false;
          await chrome.storage.local.set({config});
          if (generation !== stopGeneration) await chrome.storage.local.set({config: {...config, enabled: false}});
          await patchRuntime({cursor: 0}); await schedule(); return {};
        }
        if (message.type === 'start') {
          const generation = stopGeneration;
          haltRequested = false;
          if (running) throw new Error('Попередня перевірка ще завершується.');
          const config = await load(); validateConfig(config);
          if (!config.rows.some(r => r.active)) throw new Error('Додай хоча б один активний рядок.');
          const snapshot = await steamOperation('snapshot');
          if (generation !== stopGeneration) return {};
          const rt = await runtime();
          if (config.account && config.account !== snapshot.account && Object.keys(rt.pending).length) throw new Error('Спочатку перевір і розблокуй незавершені операції попереднього акаунту.');
          await chrome.storage.local.set({config: {...config, enabled: true, account: snapshot.account, currency: snapshot.currency}});
          if (generation !== stopGeneration) {await chrome.storage.local.set({config: {...config, enabled: false}}); return {};}
          await patchRuntime({cursor: 0, error: null}); await schedule(); void cycle(); return {};
        }
        if (message.type === 'unlock') {
          if (running || (await load()).enabled) throw new Error('Вимкни автооновлення і дочекайся завершення перевірки.');
          const rt = await runtime(); delete rt.pending[message.id]; await patchRuntime({pending: rt.pending}); return {};
        }
      } finally {controlBusy = false;}
    }
    throw new Error('Невідома команда.');
  })().then(data => respond({ok: true, ...data}), error => respond({ok: false, error: error.message}));
  return true;
});
// Recreate lost alarms whenever the MV3 worker wakes, without resetting existing ones.
void schedule();
