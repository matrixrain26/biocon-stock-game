declare module '*.json' {
  const value: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  export default value;
}
