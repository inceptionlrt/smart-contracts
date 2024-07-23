// https://github.com/safe-global/safe-react-apps/blob/main/apps/tx-builder/src/lib/checksum.ts
const stringifyReplacer = (_, value) => (value === undefined ? null : value);

const serializeJSONObject = (json) => {
  if (Array.isArray(json)) {
    return `[${json.map((el) => serializeJSONObject(el)).join(",")}]`;
  }

  if (typeof json === "object" && json !== null) {
    let acc = "";
    const keys = Object.keys(json).sort();
    acc += `{${JSON.stringify(keys, stringifyReplacer)}`;

    for (let i = 0; i < keys.length; i++) {
      acc += `${serializeJSONObject(json[keys[i]])},`;
    }

    return `${acc}}`;
  }

  return `${JSON.stringify(json, stringifyReplacer)}`;
};

const calculateChecksum = (batchFile, web3) => {
  const serialized = serializeJSONObject({
    ...batchFile,
    meta: { ...batchFile.meta, name: null },
  });
  const sha = web3.utils.sha3(serialized);

  return sha || undefined;
};

const addChecksum = (batchFile, web3) => {
  return {
    ...batchFile,
    meta: {
      ...batchFile.meta,
      checksum: calculateChecksum(batchFile, web3),
    },
  };
};

const validateChecksum = (batchFile) => {
  const targetObj = { ...batchFile };
  const checksum = targetObj.meta.checksum;
  delete targetObj.meta.checksum;

  return calculateChecksum(targetObj) === checksum;
};

module.exports = {
  validateChecksum,
  addChecksum,
};
