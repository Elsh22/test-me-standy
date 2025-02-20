// src/types/web-serial.d.ts

interface SerialPort {
    readable: ReadableStream;
    writable: WritableStream;
    open(options: SerialOptions): Promise<void>;
  }
  
  interface SerialOptions {
    baudRate: number;
  }
  
  interface SerialPortRequestOptions {
    filters?: SerialPortFilter[];
  }
  
  interface SerialPortFilter {
    usbVendorId?: number;
    usbProductId?: number;
  }
  
  interface NavigatorSerial {
    getPorts(): Promise<SerialPort[]>;
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
  }
  
  interface Navigator {
    serial: NavigatorSerial;
  }