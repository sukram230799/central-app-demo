function formatYesNo(value) {
  return value ? "Yes" : "No";
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function formatBytes(bytes, decimals) {
  if (bytes == 0) return "0 Bytes";
  var k = 1024,
    dm = decimals || 2,
    sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function unitHumanReadable(value, unit = undefined, format, multiplier = undefined) {
  if (multiplier !== undefined && typeof value === "number")
    value = value * multiplier;

  if (!format) {
    if (unit !== undefined)
      return `${value} ${unit}`;
    else return value;
  } else if (typeof value === "boolean") return format(value);
  return format(value);
}


export {
  formatYesNo, formatBytes, formatDate, unitHumanReadable
}
