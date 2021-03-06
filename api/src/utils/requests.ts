import { LocaleId, LocaleIds } from '@coronatab/shared'
import * as express from 'express'
import * as geoip from 'geoip-lite'

export class Requests {
  static getIP (req: express.Request) {
    const ip = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      (req.socket ? req.socket.remoteAddress : null)
    return typeof ip === 'string' ? ip.split(',')[0] : ip[0]
  }

  static getGeo (req: express.Request) {
    const ip = this.getIP(req)
    return geoip.lookup(ip)
  }

}
