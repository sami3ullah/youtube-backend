"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// console.log("hi there")
// import dotenv from "dotenv"
const db_1 = __importDefault(require("./db"));
// dotenv.config({
//   path: "./env"
// })
(0, db_1.default)();
