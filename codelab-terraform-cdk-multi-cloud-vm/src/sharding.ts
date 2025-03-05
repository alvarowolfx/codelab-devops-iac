
const hashCode = (s: string) =>
    s.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
  
export const getShards = (
    values: string[],
    shardCount: number,
    shardingMethod: string
  ) => {
    const shards: string[][] = Array.from({ length: shardCount }, () => []);
    if (shardingMethod === "round-robin") {
        values.forEach((value, index) => {
        shards[index % shardCount].push(value);
      });
      return shards;
    } else if (shardingMethod === "hash") {
        values.forEach((value) => {
        let shardIndex = hashCode(value) % shardCount;
        if (shardIndex < 0) {
          shardIndex *= -1;
        }
        shards[shardIndex].push(value);
      });
      return shards;
    } else if (shardingMethod === "range") {
      values.forEach((value, index) => {
        const shardIndex = Math.floor(index / (values.length / shardCount));
        shards[shardIndex].push(value);
      });
      return shards;
    }
    return [values];
  };