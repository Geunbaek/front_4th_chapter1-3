export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Notification {
  id: number;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export interface Item {
  id: number;
  name: string;
  category: string;
  price: number;
}
