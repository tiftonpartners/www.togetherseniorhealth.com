export const calcSize = ({
  width,
  height,
  count,
  minRatio,
  maxRatio
}: {
  width: number;
  height: number;
  count: number;
  minRatio: number;
  maxRatio: number;
}) => {
  let maxArea;
  let itemWidth;
  let itemHeight;
  let resultWidth;
  let resultHeight;

  // Let resultRows, resultCols
  for (let i = 1; i <= count; i++) {
    const rows = i;
    const cols = Math.ceil(count / i);

    itemWidth = Math.floor((width - 5) / cols);
    itemHeight = Math.floor((height - 5) / rows);

    let ratio = itemHeight / itemWidth;
    // If radio > max or < min
    if (ratio > minRatio) {
      ratio = maxRatio;
      itemHeight = ratio * itemWidth;
    } else if (ratio < minRatio) {
      ratio = maxRatio;
      itemWidth = itemHeight / ratio;
    }

    const area = itemWidth * itemHeight * count;

    // If this width and height takes up the most space then we're going with that
    if (maxArea === undefined || area > maxArea) {
      maxArea = area;
      resultHeight = itemHeight;
      resultWidth = itemWidth;
      // ResultCols = cols
      // resultRows = rows
    }
  }

  return {
    height: resultHeight,
    width: resultWidth
  };
};
