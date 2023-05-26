const mean = arr => {
  const sum = arr.reduce((a, b) => a + b, 0);
  return (sum / arr.length);
};

const stdev = arr => {
  const n = arr.length;
  const mean = arr.reduce((a, b) => a + b) / n;
  return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
};

const median = arr => {
  const mid = Math.floor(arr.length / 2),
    nums = [...arr].sort((a, b) => a - b);
  return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

const mode = arr => {
  let object = {}
  for (let i = 0; i < arr.length; i++) {
    if (object[arr[i]]) {
      object[arr[i]] += 1;
    } else {
      object[arr[i]] = 1;
    }
  }
  let biggestValue = -1;
  let biggestValuesKey = -1;
  Object.keys(object).forEach(key => {
    let value = object[key]
    if (value > biggestValue) {
      biggestValue = value
      biggestValuesKey = key
    }
  });
  return biggestValuesKey;
};
