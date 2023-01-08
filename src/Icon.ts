/**
 * The default height and width of an icon (assuming icons are a square).
 */
const ICON_SIZE = 144;
/**
 * The default radius of the badge.
 */
const DEFAULT_BADGE_SIZE = 25;
/**
 * The amount of padding between the icon edge and the badge.
 */
const BADGE_PADDING = 10;

/**
 * The corner of the icon where a badge should be added.
 */
export enum BadgePosition {
  TopLeft = 'topleft',
  TopRight = 'topright',
  BottomLeft = 'bottomleft',
  BottomRight = 'bottomright'
}

/**
 * Options for drawing the badge on the icon; only a `value` is required.
 */
export interface BadgeOptions {
  value: string;
  color?: string;
  textColor?: string;
  position?: BadgePosition;
  size?: number;
  fontSize?: number;
  fontFamily?: string;
}

/**
 * Convenience class for drawing a new icon for use as an action's image.
 */
export default class Icon {
  /**
   * The canvas where the icon is drawn.
   */
  protected canvas: HTMLCanvasElement;
  /**
   * Options for adding an optional badge to the icon.
   */
  protected badge?: BadgeOptions;

  constructor() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = ICON_SIZE;

    this.canvas = canvas;
  }

  /**
   * Retrieves the current 2D drawing context.
   * @returns The current 2D drawing context.
   */
  public getContext(): CanvasRenderingContext2D {
    return this.canvas.getContext('2d');
  }

  /**
   * Adds a bitmap image to the icon.
   * 
   * Note that this method is asynchronous -- the image must be loaded before it can be drawn.
   * 
   * @param imagePath - The relative path where the image can be found.
   * @param x - The x position where to draw the image (default = 0).
   * @param y - The y position where to draw the image (default = 0).
   * @param width - The width to use when drawing the image (defaults to the intrinsic width).
   * @param height - The height to use when drawing the image (defaults to the intrinsic height).
   * @returns A promise that resolves to the current once the image has been drawn.
   */
  public addImage(imagePath: string, x = 0, y = 0, width?: number, height?: number): Promise<Icon> {
    const image = new Image();
    image.src = imagePath;

    return new Promise<Icon>((resolve, reject) => {
      image.onload = () => {
        const ctx = this.getContext();
        ctx.drawImage(image, x, y, width, height);
        resolve(this);
      };
      image.onerror = (error) => reject(error);
    });
  }

  /**
   * Removes the current badge from the icon.
   * @returns The current icon.
   */
  public clearBadge(): this {
    this.badge = null;
    return this;
  }

  /**
   * Sets parameters to use when drawing a badge.
   * @param options - Options for drawing the badge.
   * @returns The current icon.
   */
  public setBadge(options: BadgeOptions): this {
    this.badge = options;
    return this;
  }

  /**
   * Retrieves the current badge.
   * @returns The current options being applied when drawing the badge.
   */
  public getBadge(): BadgeOptions|null {
    return this.badge;
  }

  /**
   * Renders a bitmap of the icon.
   * 
   * @param type - The type of image (default = image/png).
   * @returns A bitmap image of the rendered icon.
   */
  public getImage(type = 'image/png'): string {
    const finalCanvas = this.getCanvasCopy();
    if (this.badge) {
      Icon.drawBadge(finalCanvas, this.badge);
    }
    return finalCanvas.toDataURL(type);
  }

  /**
   * Generates a copy of the current canvas.
   * 
   * This is used for drawing a copy of the icon with a badge
   * without damaging the unbadged icon.
   * 
   * @returns A copy of the current canvas.
   */
  protected getCanvasCopy(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.height = this.canvas.height;
    canvas.width = this.canvas.width;
    canvas.getContext('2d').drawImage(this.canvas, 0, 0);
    return canvas;
  }

  /**
   * Draws a badge on an icon.
   * 
   * @param canvas - The canvas where the badge should be drawn.
   * @param options - The options to consider when drawing the badge.
   */
  protected static drawBadge(canvas: HTMLCanvasElement, options: BadgeOptions) {
    if (typeof options === 'undefined' || !options.value || options.value == '0') {
      return;
    }

    const coordinates = this.getBadgeCoordinates(options.position ?? BadgePosition.TopRight, options.size ?? DEFAULT_BADGE_SIZE, canvas);
    const ctx = canvas.getContext('2d');

    // Circle
    ctx.beginPath();
    ctx.arc(coordinates.x, coordinates.y, options.size ?? DEFAULT_BADGE_SIZE, 0, Math.PI * 2);
    ctx.fillStyle = options.color ?? 'red';
    ctx.fill();

    // Label
    ctx.fillStyle = options.textColor ?? 'white';
    ctx.font = `${options.fontSize ?? 32}px ${options.fontFamily ?? 'Helvetica, Arial, sans-serif'}`;
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(options.value, coordinates.x, coordinates.y);
  }

  /**
   * Computes where a badge should be drawn on the icon.
   * 
   * @param position - Which corner the badge should be drawn in.
   * @param size - The radius of the badge.
   * @param canvas - The canvas containing the icon.
   * @returns X and Y coordinates where the badge should be drawn.
   */
  protected static getBadgeCoordinates(position: BadgePosition, size: number, canvas: HTMLCanvasElement): BadgeCoordinates {
    return {
      x: position == BadgePosition.TopLeft || position == BadgePosition.BottomLeft 
        ? BADGE_PADDING + size
        : canvas.width - BADGE_PADDING - size,
      y: position == BadgePosition.BottomLeft || position == BadgePosition.BottomRight
        ? canvas.height - BADGE_PADDING - size
        : BADGE_PADDING + size
    };
  }
}

/**
 * Coordinates for the badge.
 */
interface BadgeCoordinates {
  x: number;
  y: number;
}