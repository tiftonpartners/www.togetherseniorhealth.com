/**
 * What type of solution solved the sizing?
 */
export enum SolutionType {
  ByHeight = 'byHeight',
  ByWidth = 'byWidth',
  UNKNOWN = 'unknown'
}

/**
 * This contains a solution to the sizing of the videos
 */
export class SizeSoln {
  numVideos: number; // Number of videos
  w: number; // Video width, px
  h: number; // Video height, px
  rows: number; // Total number of rows in the grid
  cols: number; // Total number of columns in the grid
  type: SolutionType; // Were we limited by rows, or by columns?
  aspectRatio: number; // Aspect ration for videos (h/w), usually < 1 (for example 9/16)
  area: number; // Area, px^2
  view: { w: number; h: number }; // Dimensions of the view we are filling
  spacing: { h: number; v: number }; // Horizontal and vertical spacing, px
  margins: { top: number; right: number; bottom: number; left: number };
  size: { h: number; w: number }; // Calculated size, px

  constructor(
    numVideos: number,
    w: number,
    h: number,
    rows: number,
    cols: number,
    view: { w: number; h: number },
    spacing: { h: number; v: number },
    margins: { top: number; right: number; bottom: number; left: number },
    type: SolutionType
  ) {
    this.numVideos = numVideos;
    this.w = w;
    this.h = h;
    this.aspectRatio = h / w;
    this.area = h * w;
    this.rows = rows;
    this.cols = cols;
    this.type = type;
    this.view = view;
    this.spacing = spacing;
    this.margins = margins;
    this.size = {
      h: this.h * rows + (this.spacing.v * (rows - 1) + margins.top + margins.bottom),
      w: this.w * cols + (this.spacing.h * (cols - 1) + margins.left + margins.right)
    };
  }

  /**
   * Get row and column number for cell number
   *
   * @param cellNumber Cell index, starting with 0 up to count-1
   * @returns An object with row and col of the cell number, each starting with 1
   */
  getLocation(cellNumber: number): { row: number; col: number } {
    const r = Math.ceil((cellNumber + 1) / this.cols);
    const c = Math.ceil(cellNumber % this.cols) + 1;
    return { row: r, col: c };
  }

  /**
   * Get the x/y coordinates of a cell
   *
   * @param cellNumber Cell index, starting with 0 up to count-1
   */
  getPosition(cellNumber: number): { top: number; left: number } {
    const { row, col } = this.getLocation(cellNumber);
    // Space to leave to get the size centered horzontally
    const dw = (this.view.w - this.size.w) / 2;
    return { top: (row - 1) * (this.h + this.spacing.v), left: (col - 1) * (this.w + this.spacing.h) + dw };
  }
}

/**
 * This finds a set of solutions for grid size assuming there are a certain
 * number of rows and that the rows will exactly fill the height of
 * the grid.
 *
 * It figures out what the height of the
 * rows would be to fill the height of the view, then calculates
 * the corresponding column widths based on the given aspect ratio.
 * If the total width of the solution is too wide for the view, it is
 * discarded.
 *
 * Notice that the separations are the space *between* videos, and excludes
 * the space between the videos and the container.  The edges of the
 * grid will fill the container.
 *
 * All values are in px, aspectRatio = w/h and is usually < 1.
 */
function SolveForHeight(
  rows: number,
  numVideos: number,
  aspectRatio: number,
  view: { w: number; h: number },
  spacing: { h: number; v: number },
  margins: { top: number; right: number; bottom: number; left: number }
): SizeSoln[] {
  const solns: SizeSoln[] = [];
  const cols = Math.ceil(numVideos / rows);
  let m = (rows - 1) * spacing.v + margins.top + margins.bottom;
  const h = (view.h - m) / rows;

  if (h < 0) {
    return solns;
  }

  const w = h / aspectRatio;
  m = (cols - 1) * spacing.h + margins.left + margins.right;
  const totalWidth = w * cols + m;
  const isValidSize = totalWidth <= view.w;
  if (isValidSize) {
    const size = new SizeSoln(numVideos, w, h, rows, cols, view, spacing, margins, SolutionType.ByHeight);
    solns.push(size);
  }
  return solns;
}

/**
 * This finds a set of solutions for grid size assuming there are a certain
 * number of columns and that the columns will exactly fill the width of
 * the grid.
 *
 * It figures out what the width of the
 * columns would be to fill the width of the view, then calculates
 * the corresponding row heights based on the given aspect ratio.
 * If the total width of the solution is too high for the view, it is
 * discarded.
 *
 * Notice that the margin is the space *between* videos, and excludes
 * the space between the videos and the container.  The edges of the
 * grid will fill the container.
 *
 * All values are in px, aspectRatio = w/h and is usually < 1.
 */
function SolveForWidth(
  cols: number,
  numVideos: number,
  aspectRatio: number,
  view: { w: number; h: number },
  spacing: { h: number; v: number },
  margins: { top: number; right: number; bottom: number; left: number }
): SizeSoln[] {
  const solns: SizeSoln[] = [];
  const rows = Math.ceil(numVideos / cols);
  let m = (cols - 1) * spacing.h + margins.left + margins.right;
  const w = (view.w - m) / cols;

  if (w < 0) {
    return solns;
  }

  const h = w * aspectRatio;
  m = (rows - 1) * spacing.v + margins.top + margins.bottom;
  const totalHeight = h * rows + m;
  const isValidSize = totalHeight <= view.h;
  if (isValidSize) {
    const size = new SizeSoln(numVideos, w, h, rows, cols, view, spacing, margins, SolutionType.ByWidth);
    solns.push(size);
  }
  return solns;
}

/**
 * Determine the solution yeilding the videos with the
 * largest area
 *
 * @param solns List of viable solutions
 */
function MaxArea(solns: SizeSoln[]): SizeSoln {
  let result: SizeSoln = null;
  solns.forEach(soln => {
    if (!result) {
      result = soln;
    } else {
      if (soln.area > result.area) {
        result = soln;
      }
    }
  });

  return result;
}

/**
 * Calculate video sizes given width and height of the containing view,
 * the number of videos, and the aspect ratios, and horizontal and
 * vertical separations.
 */
export function CalcSizes(
  numVideos: number,
  aspectRatio: number,
  view: { w: number; h: number },
  separations: { h: number; v: number },
  margins: { top: number; right: number; bottom: number; left: number }
): SizeSoln {
  let solns: SizeSoln[] = [];
  for (let rows = 1; rows <= numVideos; rows++) {
    const rowsAreas = SolveForHeight(rows, numVideos, aspectRatio, view, separations, margins);
    const colsAreas = SolveForWidth(rows, numVideos, aspectRatio, view, separations, margins);
    solns = [...solns, ...rowsAreas, ...colsAreas];
  }
  return MaxArea(solns);
}
