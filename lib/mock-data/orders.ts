import type { Order, OrderStatus } from "@/lib/types/webshop";
import { mockProducts } from "./products";

// Helper to get random products for orders
const getRandomProducts = () => {
  const count = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...mockProducts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Generate mock orders
export const mockOrders: Order[] = [
  {
    id: "order-1",
    orderNumber: "BP-2024-001",
    customerName: "Ana Kovačević",
    customerEmail: "ana.kovacevic@example.com",
    items: [
      { product: mockProducts[0], quantity: 2 },
      { product: mockProducts[6], quantity: 1 },
    ],
    subtotal: 469.97,
    shipping: 0,
    total: 469.97,
    status: "delivered",
    createdAt: new Date("2024-03-15T10:30:00"),
    updatedAt: new Date("2024-03-18T14:00:00"),
    shippingAddress: {
      fullName: "Ana Kovačević",
      street: "Ilica 123",
      city: "Zagreb",
      postalCode: "10000",
      country: "Hrvatska",
      phone: "+385 91 234 5678",
    },
  },
  {
    id: "order-2",
    orderNumber: "BP-2024-002",
    customerName: "Marija Horvat",
    customerEmail: "marija.horvat@example.com",
    items: [
      { product: mockProducts[1], quantity: 1 },
      { product: mockProducts[10], quantity: 1 },
      { product: mockProducts[11], quantity: 1 },
    ],
    subtotal: 251.97,
    shipping: 0,
    total: 251.97,
    status: "shipped",
    createdAt: new Date("2024-03-18T14:20:00"),
    updatedAt: new Date("2024-03-19T09:00:00"),
    shippingAddress: {
      fullName: "Marija Horvat",
      street: "Vukovarska 45",
      city: "Split",
      postalCode: "21000",
      country: "Hrvatska",
      phone: "+385 98 765 4321",
    },
  },
  {
    id: "order-3",
    orderNumber: "BP-2024-003",
    customerName: "Ivana Babić",
    customerEmail: "ivana.babic@example.com",
    items: [
      { product: mockProducts[3], quantity: 1 },
    ],
    subtotal: 149.99,
    shipping: 0,
    total: 149.99,
    status: "processing",
    createdAt: new Date("2024-03-19T16:45:00"),
    updatedAt: new Date("2024-03-19T16:45:00"),
    shippingAddress: {
      fullName: "Ivana Babić",
      street: "Korzo 78",
      city: "Rijeka",
      postalCode: "51000",
      country: "Hrvatska",
      phone: "+385 95 111 2233",
    },
  },
  {
    id: "order-4",
    orderNumber: "BP-2024-004",
    customerName: "Petra Novak",
    customerEmail: "petra.novak@example.com",
    items: [
      { product: mockProducts[10], quantity: 2 },
      { product: mockProducts[11], quantity: 2 },
    ],
    subtotal: 103.96,
    shipping: 0,
    total: 103.96,
    status: "pending",
    createdAt: new Date("2024-03-20T09:15:00"),
    updatedAt: new Date("2024-03-20T09:15:00"),
    shippingAddress: {
      fullName: "Petra Novak",
      street: "Trg bana Jelačića 1",
      city: "Zagreb",
      postalCode: "10000",
      country: "Hrvatska",
      phone: "+385 91 555 6666",
    },
  },
  {
    id: "order-5",
    orderNumber: "BP-2024-005",
    customerName: "Lana Matić",
    customerEmail: "lana.matic@example.com",
    items: [
      { product: mockProducts[5], quantity: 1 },
      { product: mockProducts[7], quantity: 1 },
    ],
    subtotal: 399.98,
    shipping: 0,
    total: 399.98,
    status: "pending",
    createdAt: new Date("2024-03-20T11:30:00"),
    updatedAt: new Date("2024-03-20T11:30:00"),
    shippingAddress: {
      fullName: "Lana Matić",
      street: "Gundulićeva 15",
      city: "Osijek",
      postalCode: "31000",
      country: "Hrvatska",
      phone: "+385 99 888 7777",
    },
  },
  {
    id: "order-6",
    orderNumber: "BP-2024-006",
    customerName: "Tea Jurić",
    customerEmail: "tea.juric@example.com",
    items: [
      { product: mockProducts[2], quantity: 1 },
    ],
    subtotal: 189.99,
    shipping: 0,
    total: 189.99,
    status: "delivered",
    createdAt: new Date("2024-03-10T13:00:00"),
    updatedAt: new Date("2024-03-14T10:00:00"),
    shippingAddress: {
      fullName: "Tea Jurić",
      street: "Maksimirska 100",
      city: "Zagreb",
      postalCode: "10000",
      country: "Hrvatska",
      phone: "+385 91 222 3333",
    },
  },
  {
    id: "order-7",
    orderNumber: "BP-2024-007",
    customerName: "Sara Perić",
    customerEmail: "sara.peric@example.com",
    items: [
      { product: mockProducts[8], quantity: 1 },
      { product: mockProducts[9], quantity: 2 },
    ],
    subtotal: 89.97,
    shipping: 9.99,
    total: 99.96,
    status: "cancelled",
    createdAt: new Date("2024-03-12T15:30:00"),
    updatedAt: new Date("2024-03-13T08:00:00"),
    notes: "Kupac otkazao narudžbu",
  },
  {
    id: "order-8",
    orderNumber: "BP-2024-008",
    customerName: "Mia Tomić",
    customerEmail: "mia.tomic@example.com",
    items: [
      { product: mockProducts[4], quantity: 1 },
      { product: mockProducts[12], quantity: 1 },
      { product: mockProducts[13], quantity: 1 },
    ],
    subtotal: 236.97,
    shipping: 0,
    total: 236.97,
    status: "shipped",
    createdAt: new Date("2024-03-17T10:00:00"),
    updatedAt: new Date("2024-03-19T14:00:00"),
    shippingAddress: {
      fullName: "Mia Tomić",
      street: "Savska 25",
      city: "Zagreb",
      postalCode: "10000",
      country: "Hrvatska",
      phone: "+385 98 444 5555",
    },
  },
];

// Helper functions
export function getOrderById(id: string): Order | undefined {
  return mockOrders.find((o) => o.id === id);
}

export function getOrdersByStatus(status: OrderStatus): Order[] {
  return mockOrders.filter((o) => o.status === status);
}

export function getRecentOrders(limit: number = 5): Order[] {
  return [...mockOrders]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export function getOrderStats() {
  const totalOrders = mockOrders.length;
  const pendingOrders = mockOrders.filter((o) => o.status === "pending").length;
  const totalRevenue = mockOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const averageOrderValue = totalRevenue / (totalOrders - mockOrders.filter((o) => o.status === "cancelled").length);

  return {
    totalOrders,
    pendingOrders,
    totalRevenue,
    averageOrderValue,
  };
}
