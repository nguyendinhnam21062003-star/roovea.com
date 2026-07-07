import { randomBytes } from "node:crypto"

console.log(`ADMIN_SESSION_SECRET=${randomBytes(32).toString("hex")}`)
console.log(`FIELD_ENCRYPTION_KEY=${randomBytes(32).toString("hex")}`)
