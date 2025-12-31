import { get_random_key } from './auth/ecc/src/key_utils.js';

export default VIZ_API => {
  function numberWithCommas(x) {
    return x.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function vestingVIZ(account, gprops) {
    const shares = parseFloat(account.vesting_shares.split(' ')[0]);
    const total_shares = parseFloat(gprops.total_vesting_shares.split(' ')[0]);
    const total_vest_viz = parseFloat(gprops.total_vesting_fund.split(' ')[0]);
    const vesting_viz = total_vest_viz * (shares / total_shares);
    return vesting_viz;
  }

  async function estimateAccountValue(account, { gprops, vesting_viz } = {}) {
    if (!VIZ_API) {
      throw new Error('VIZ_API is required for estimateAccountValue');
    }

    const promises = [];
    if (!vesting_viz) {
      if (!gprops) {
        promises.push(
          VIZ_API.getStateAsync('/@{username}').then(data => {
            gprops = data.props;
            vesting_viz = vestingVIZ(account, gprops);
          })
        );
      } else {
        vesting_viz = vestingVIZ(account, gprops);
      }
    }
    await Promise.all(promises);
      const balance = parseFloat(account.balance.split(' ')[0]);
      const total_viz = vesting_viz + balance;
      return total_viz.toFixed(3);
  }

  function createSuggestedPassword() {
    const PASSWORD_LENGTH = 32;
    const privateKey = get_random_key();
    return privateKey.toWif().substring(3, 3 + PASSWORD_LENGTH);
  }

  return {
    sharesToVIZ(vestingShares, totalVestingShares, totalVestingFund) {
      return (
        parseFloat(totalVestingFund) *
        (parseFloat(vestingShares) / parseFloat(totalVestingShares))
      );
    },
    contentPermlink(parentAuthor, parentPermlink) {
      const timeStr = new Date()
        .toISOString()
        .replace(/[^a-zA-Z0-9]+/g, '')
        .toLowerCase();
      parentPermlink = parentPermlink.replace(/(-\d{8}t\d{9}z)/g, '');
      return `re-${parentAuthor}-${parentPermlink}-${timeStr}`;
    },
    amount(amount, asset) {
      return `${amount.toFixed(3)} ${asset}`;
    },
    numberWithCommas,
    vestingVIZ,
    estimateAccountValue,
    createSuggestedPassword
  };
};
