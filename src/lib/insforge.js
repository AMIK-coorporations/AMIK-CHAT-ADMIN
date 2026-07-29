import { createClient } from '@insforge/sdk'

export const INSFORGE_CONFIG = {
    baseUrl: 'https://484txp7m.ap-southeast.insforge.app',
    anonKey: 'anon_d52e90e7e94ac4942768d85d1a3215313446b9cb8dce158d8dbd940c0c63072f'
}

export const insforge = createClient(INSFORGE_CONFIG)
