import { create } from "zustand";

type CartStore = {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  checkingOut: boolean;
  setCheckingOut: (v: boolean) => void;
};

export const useCartStore = create<CartStore>((set) => ({
  cartOpen: false,
  setCartOpen: (open) => set({ cartOpen: open, checkingOut: false }),
  checkingOut: false,
  setCheckingOut: (v) => set({ checkingOut: v }),
}));
