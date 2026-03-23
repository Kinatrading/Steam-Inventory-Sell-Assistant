(function initSteamMarketFees(globalScope) {
  const STEAM_FEE_PERCENT = 0.05;
  const PUBLISHER_FEE_PERCENT = 0.10;
  const MINIMUM_FEE_CENTS = 1;
  const BASE_FEE_CENTS = 0;
  const MINIMUM_NET_CENTS = 1;

  function normalizeCents(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return null;
    return Math.round(numericValue);
  }

  function priceToCents(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return null;
    return Math.round(numericValue * 100);
  }

  function centsToPrice(valueInCents) {
    const cents = normalizeCents(valueInCents);
    if (!Number.isFinite(cents)) return null;
    return cents / 100;
  }

  function calculateFeeDetailsForNetCents(netCents, publisherFeePercent = PUBLISHER_FEE_PERCENT) {
    const normalizedNetCents = normalizeCents(netCents);
    if (!Number.isFinite(normalizedNetCents) || normalizedNetCents < MINIMUM_NET_CENTS) {
      return null;
    }

    const steamFee = Math.floor(
      Math.max(normalizedNetCents * STEAM_FEE_PERCENT, MINIMUM_FEE_CENTS) + BASE_FEE_CENTS
    );
    const publisherFee = Math.floor(
      publisherFeePercent > 0
        ? Math.max(normalizedNetCents * publisherFeePercent, MINIMUM_FEE_CENTS)
        : 0
    );

    return {
      netCents: normalizedNetCents,
      steamFeeCents: steamFee,
      publisherFeeCents: publisherFee,
      feeCents: steamFee + publisherFee,
      grossCents: normalizedNetCents + steamFee + publisherFee,
    };
  }

  function calculateGrossFromNetCents(netCents, publisherFeePercent = PUBLISHER_FEE_PERCENT) {
    return calculateFeeDetailsForNetCents(netCents, publisherFeePercent)?.grossCents ?? null;
  }

  function calculateFeeDetailsForGrossCents(grossCents, publisherFeePercent = PUBLISHER_FEE_PERCENT) {
    const normalizedGrossCents = normalizeCents(grossCents);
    if (!Number.isFinite(normalizedGrossCents) || normalizedGrossCents < MINIMUM_NET_CENTS) {
      return null;
    }

    let iterations = 0;
    let estimatedNetCents = Math.trunc(
      (normalizedGrossCents - BASE_FEE_CENTS) / (STEAM_FEE_PERCENT + publisherFeePercent + 1)
    );
    let undershot = false;
    let fees = calculateFeeDetailsForNetCents(estimatedNetCents, publisherFeePercent);

    while (fees && fees.grossCents !== normalizedGrossCents && iterations < 10) {
      if (fees.grossCents > normalizedGrossCents) {
        if (undershot) {
          const adjustedFees = calculateFeeDetailsForNetCents(estimatedNetCents - 1, publisherFeePercent);
          if (!adjustedFees) break;

          adjustedFees.steamFeeCents += normalizedGrossCents - adjustedFees.grossCents;
          adjustedFees.feeCents += normalizedGrossCents - adjustedFees.grossCents;
          adjustedFees.grossCents = normalizedGrossCents;
          fees = adjustedFees;
          break;
        }

        estimatedNetCents -= 1;
      } else {
        undershot = true;
        estimatedNetCents += 1;
      }

      fees = calculateFeeDetailsForNetCents(estimatedNetCents, publisherFeePercent);
      iterations += 1;
    }

    return fees?.grossCents === normalizedGrossCents ? fees : null;
  }

  function calculateNetFromGrossCents(grossCents, publisherFeePercent = PUBLISHER_FEE_PERCENT) {
    return calculateFeeDetailsForGrossCents(grossCents, publisherFeePercent)?.netCents ?? null;
  }

  function calculateGrossFromNet(netPrice, publisherFeePercent = PUBLISHER_FEE_PERCENT) {
    const netCents = priceToCents(netPrice);
    const grossCents = calculateGrossFromNetCents(netCents, publisherFeePercent);
    return centsToPrice(grossCents);
  }

  function calculateNetFromGross(grossPrice, publisherFeePercent = PUBLISHER_FEE_PERCENT) {
    const grossCents = priceToCents(grossPrice);
    const netCents = calculateNetFromGrossCents(grossCents, publisherFeePercent);
    return centsToPrice(netCents);
  }

  const api = {
    STEAM_FEE_PERCENT,
    PUBLISHER_FEE_PERCENT,
    MINIMUM_FEE_CENTS,
    BASE_FEE_CENTS,
    MINIMUM_NET_CENTS,
    priceToCents,
    centsToPrice,
    calculateFeeDetailsForNetCents,
    calculateFeeDetailsForGrossCents,
    calculateGrossFromNetCents,
    calculateNetFromGrossCents,
    calculateGrossFromNet,
    calculateNetFromGross,
  };

  globalScope.SteamMarketFees = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
