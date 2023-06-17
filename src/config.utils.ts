function clone<T = any>(value: T) {
  return value && !isPrimitive(value)
    ? JSON.parse(JSON.stringify(value))
    : value;
}

function isPrimitive<T = any>(value: T): boolean {
  return ['number', 'string', 'boolean'].includes(typeof value);
}

function mergeArrays(destination: Array<any>, source: Array<any>): Array<any> {
  const result = clone<Array<any>>(destination);
  for (let i = 0; i < source.length; i++) {
    const sourceValue = source[i];
    const destinationValue = result[i];

    if (!Reflect.has(result, i)) {
      result[i] = source[i];
    } else if (Array.isArray(sourceValue) && Array.isArray(destinationValue)) {
      result[i] = mergeArrays(destinationValue, sourceValue);
    } else if (!isPrimitive(destinationValue)) {
      result[i] = mergeObjects(destinationValue, sourceValue);
    }
  }

  return result;
}

function mergeObjects(destination, source) {
  if (!source) {
    return destination;
  }

  const result = clone(destination) || {};

  Object.keys(source).forEach((property) => {
    const sourceValue = source[property];

    if (!Reflect.has(result, property)) {
      result[property] = sourceValue;
      return;
    }

    const destinationValue = result[property];

    if (isPrimitive(sourceValue)) {
      return;
    }

    if (Array.isArray(sourceValue) && Array.isArray(destinationValue)) {
      result[property] = mergeArrays(destinationValue, sourceValue);
      return;
    }

    result[property] = mergeObjects(destinationValue, sourceValue);
  });

  return result;
}

export default function deepMerge(...objects) {
  if (!objects.length) {
    return {};
  }

  if (objects.length === 1) {
    return objects[0];
  }

  const destination = objects.shift();
  const source = objects.shift();
  const result = mergeObjects(destination, source);

  return deepMerge(result, ...objects);
}
