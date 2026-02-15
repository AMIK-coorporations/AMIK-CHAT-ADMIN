import { createClient } from '@insforge/sdk'

export const INSFORGE_CONFIG = {
    baseUrl: 'https://suiirdm9.ap-southeast.insforge.app',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4ODQxMTl9.sSlFyglJA_l4YJvsYSHh--nW10E8hOdLSVdXBt7Tj7o'
}

export const insforge = createClient(INSFORGE_CONFIG)
