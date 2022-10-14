import axios from 'axios';

// Default config options
const defaultOptions = {
    baseURL: process.env.NEXT_PUBLIC_API_BASE
};

// Create instance
let instance = axios.create(defaultOptions);

export default instance;
