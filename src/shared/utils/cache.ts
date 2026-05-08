import NodeCache from "node-cache";

// StdTTL: 600 means items expire after 10 minutes
const cache = new NodeCache({ stdTTL: 600, checkperiod: 60 });

export default cache;
