export interface Logger {
  info: (...msg: any) => void;
  error: (...msg: any) => void;
}
