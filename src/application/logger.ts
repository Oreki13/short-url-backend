import GelfPro from 'gelf-pro';


const logger = GelfPro;

logger.setConfig({
    fields: {facility: process.env.NODE_ENV || "development", owner: "Faztrx"}, // optional; default fields for all messages
    filter: [], // optional; filters to discard a message
    transform: [], // optional; transformers for a message
    broadcast: [], // optional; listeners of a message
    levels: {}, // optional; default: see the levels section below
    aliases: {}, // optional; default: see the aliases section below
    adapterName: 'udp', // optional; currently supported "udp", "tcp" and "tcp-tls"; default: udp
    adapterOptions: { // this object is passed to the adapter.connect() method
        host: process.env.LOG_HOST || "localhost", // optional; default: 127.0.0.1
        port: process.env.LOG_PORT || "12201", // optional; default: 12201
        family: 4, // tcp only; optional; version of IP stack; default: 4
        timeout: 1000, // tcp only; optional; default: 10000 (10 sec)
        protocol: 'udp4', // udp only; optional; udp adapter: udp4, udp6; default: udp4
    }
})

export {logger};


// export const logger = winston.createLogger({
//     // level: 'debug',
//     format: winston.format.json(),
//     transports: [
//         new winston.transports.Console({}),
//         new WinstonGraylog2(
//             {
//                 name: 'Graylog',
//                 level: 'debug',
//                 silent: false,
//                 handleExceptions: false,
//                 graylog: {
//                     servers: [{host: 'localhost', port: 12201}],
//                     facility: 'be-nodejs',
//                     bufferSize: 1350
//                 }
//             }
//         )
//     ]
// })

