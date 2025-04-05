import { Injectable } from '@angular/core';
import { Pcb } from './pcb.type';

@Injectable({
  providedIn: 'root'
})
export class PcbService {

  getProductsMini(): Pcb[] {
    return [
      {
        id: '1001',
        code: 'ARD328-UNO',
        name: 'Arduino UNO R3 PCB',
        description: 'Standard Arduino UNO microcontroller board with ATmega328P',
        image: 'arduino-uno.jpg',
        price: 24.95,
        category: 'Microcontrollers',
        quantity: 150,
        inventoryStatus: 'INSTOCK',
        rating: 5
      },
      {
        id: '1002',
        code: 'ESP32-DEV',
        name: 'ESP32 Development Board',
        description: 'Dual-core Wi-Fi+Bluetooth development board',
        image: 'esp32-dev.jpg',
        price: 12.50,
        category: 'IoT',
        quantity: 89,
        inventoryStatus: 'INSTOCK',
        rating: 4
      },
      {
        id: '1003',
        code: 'RPI4-PCB',
        name: 'Raspberry Pi 4 PCB',
        description: 'Bare PCB for Raspberry Pi 4 Model B',
        image: 'rpi4-pcb.jpg',
        price: 35.99,
        category: 'Single Board Computers',
        quantity: 5,
        inventoryStatus: 'LOWSTOCK',
        rating: 5
      },
      {
        id: '1004',
        code: 'STM32F4-DISC',
        name: 'STM32F4 Discovery PCB',
        description: 'STM32F407VGT6 MCU development board PCB',
        image: 'stm32f4-disc.jpg',
        price: 19.99,
        category: 'Microcontrollers',
        quantity: 42,
        inventoryStatus: 'INSTOCK',
        rating: 4
      },
      {
        id: '1005',
        code: 'ADLX345-SENS',
        name: 'ADXL345 Accelerometer PCB',
        description: '3-axis accelerometer breakout board',
        image: 'adxl345.jpg',
        price: 7.95,
        category: 'Sensors',
        quantity: 0,
        inventoryStatus: 'OUTOFSTOCK',
        rating: 3
      },
      {
        id: '1006',
        code: 'BLE-NRF52',
        name: 'nRF52832 BLE Module',
        description: 'Bluetooth Low Energy PCB with Nordic nRF52832 chipset',
        image: 'nrf52-ble.jpg',
        price: 14.50,
        category: 'Wireless',
        quantity: 27,
        inventoryStatus: 'INSTOCK',
        rating: 4
      },
      {
        id: '1007',
        code: 'OLED-096',
        name: '0.96" OLED Display PCB',
        description: 'I2C OLED display module with driver board',
        image: 'oled-096.jpg',
        price: 6.99,
        category: 'Displays',
        quantity: 8,
        inventoryStatus: 'LOWSTOCK',
        rating: 4
      },
      {
        id: '1008',
        code: 'TEENSY41-MCU',
        name: 'Teensy 4.1 PCB',
        description: 'High-performance ARM Cortex-M7 development board',
        image: 'teensy41.jpg',
        price: 27.95,
        category: 'Microcontrollers',
        quantity: 35,
        inventoryStatus: 'INSTOCK',
        rating: 5
      },
      {
        id: '1009',
        code: 'GPS-NEO6M',
        name: 'NEO-6M GPS Module PCB',
        description: 'GPS receiver module with antenna and EEPROM',
        image: 'neo6m-gps.jpg',
        price: 12.95,
        category: 'Navigation',
        quantity: 0,
        inventoryStatus: 'OUTOFSTOCK',
        rating: 3
      },
      {
        id: '1010',
        code: 'MOTOR-L298N',
        name: 'L298N Motor Driver PCB',
        description: 'Dual H-bridge motor driver module for DC motors',
        image: 'l298n-driver.jpg',
        price: 5.99,
        category: 'Motor Control',
        quantity: 67,
        inventoryStatus: 'INSTOCK',
        rating: 4
      }
    ];
  }
}
