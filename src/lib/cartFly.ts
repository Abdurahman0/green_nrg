export interface CartFlyDetail {
  x: number;
  y: number;
  image?: string;
}

const CART_FLY_EVENT = 'cart-fly';

export function dispatchCartFlyFromElement(element: HTMLElement, image?: string) {
  const rect = element.getBoundingClientRect();
  const detail: CartFlyDetail = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    image
  };

  window.dispatchEvent(new CustomEvent<CartFlyDetail>(CART_FLY_EVENT, { detail }));
}

export { CART_FLY_EVENT };

