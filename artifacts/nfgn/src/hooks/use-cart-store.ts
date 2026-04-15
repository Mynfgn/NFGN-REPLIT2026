import { create } from "zustand";

type CartState = {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
};

export const useCartStore = create<CartState>((set) => ({
  cartOpen: false,
  setCartOpen: (open) => set({ cartOpen: open }),
}));
