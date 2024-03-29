import * as R from 'ramda'

export interface RNodeInfo {
  readonly domain: string
  readonly grpc?: number
  readonly http?: number
  readonly https?: number
  readonly httpAdmin?: number
  readonly httpsAdmin?: number
  readonly instance?: string
  // Network info
  readonly name?: NetworkName
  readonly title?: string
  readonly network?: RChainNetwork
}

export interface RChainNetwork {
  readonly title: string
  readonly name: NetworkName
  readonly hosts: RNodeInfo[]
  readonly readOnlys: RNodeInfo[]
  // Test net
  readonly faucet?: string
}

export type NetworkName = 'localnet' | 'testnet-llbm' | 'testnet-bm' | 'testnet' | 'mainnet'

const defaultPorts: Partial<RNodeInfo>    = { grpc: 40401, http: 40403, httpAdmin: 40405 }
const defaultPortsSSL: Partial<RNodeInfo> = { grpc: 40401, https: 443, httpAdmin: 40405 }

// Local network

export const localNet: RChainNetwork = {
  title: 'Local network',
  name: 'localnet',
  hosts: [
    { domain: 'localhost', ...defaultPorts },
    { domain: 'localhost', grpc: 40411, http: 40413, httpAdmin: 40415 },
    { domain: 'localhost', grpc: 40421, http: 40423, httpAdmin: 40425 },
    { domain: 'localhost', grpc: 40431, http: 40433, httpAdmin: 40435 },
    { domain: 'localhost', grpc: 40441, http: 40443, httpAdmin: 40445 },
    { domain: 'localhost', grpc: 40451, http: 40453, httpAdmin: 40455 },
  ],
  readOnlys: [
    { domain: 'localhost', ...defaultPorts },
    { domain: 'localhost', grpc: 40411, http: 40413, httpAdmin: 40415 },
    { domain: 'localhost', grpc: 40421, http: 40423, httpAdmin: 40425 },
    { domain: 'localhost', grpc: 40431, http: 40433, httpAdmin: 40435 },
    { domain: 'localhost', grpc: 40441, http: 40443, httpAdmin: 40445 },
    { domain: 'localhost', grpc: 40451, http: 40453, httpAdmin: 40455 },
  ]
}

// Test network (leaderless block-merge)

const getTestNetLLBMUrls = (n: number) => {
  const instance = `node${n}`
  return {
    domain: `${instance}.llbm.testnet.rchain.coop`,
    instance,
    ...defaultPortsSSL,
  }
}

const testnetLLBMHosts = R.range(0, 5).map(getTestNetLLBMUrls)

export const testNetLLBlockMerge: RChainNetwork = {
  title: 'RChain testing network (leaderless block-merge)',
  name: 'testnet-llbm',
  hosts: testnetLLBMHosts,
  readOnlys: [
    { domain: 'observer.llbm.testnet.rchain.coop', instance: 'observer', ...defaultPortsSSL },
  ],
  faucet: 'https://status.llbm.testnet.rchain.coop/testnet/faucet',
}

// Test network (block-merge)

const getTestNetBMUrls = (n: number) => {
  const instance = `node${n}`
  return {
    domain: `${instance}.bm.testnet.rchain.coop`,
    instance,
    ...defaultPortsSSL,
  }
}

const testnetBMHosts = R.range(0, 5).map(getTestNetBMUrls)

export const testNetBlockMerge: RChainNetwork = {
  title: 'RChain testing network (block-merge)',
  name: 'testnet-bm',
  hosts: testnetBMHosts,
  readOnlys: [
    { domain: 'observer.bm.testnet.rchain.coop', instance: 'observer', ...defaultPortsSSL },
  ],
  faucet: 'https://status.bm.testnet.rchain.coop/testnet/faucet',
}

// Test network

const getTestNetUrls = (n: number) => {
  const instance = `node${n}`
  return {
    domain: `${instance}.testnet.rchain.coop`,
    instance,
    ...defaultPortsSSL,
  }
}

const testnetHosts = R.range(0, 5).map(getTestNetUrls)

export const testNet: RChainNetwork = {
  title: 'RChain testing network',
  name: 'testnet',
  hosts: testnetHosts,
  readOnlys: [
    { domain: 'observer.testnet.rchain.coop', instance: 'observer', ...defaultPortsSSL },
    // Jim's read-only node
    { domain: 'rnode1.rhobot.net', ...defaultPortsSSL },
  ],
  faucet: 'https://status.rchain.coop/testnet/faucet'
}

// MAIN network

const getMainNetUrls = function (n: number): RNodeInfo {
  return {
    domain: `node${n}.root-shard.mainnet.rchain.coop`,
    ...defaultPortsSSL,
  }
}

const mainnetHosts = R.range(0, 30).map(getMainNetUrls)

export const mainNet: RChainNetwork = {
  title: 'RChain MAIN network',
  name: 'mainnet',
  hosts: mainnetHosts,
  readOnlys: [
    // Load balancer (not gRPC) server for us, asia and eu servers
    { domain: 'observer.services.mainnet.rchain.coop', https: 443 },
    { domain: 'observer-us.services.mainnet.rchain.coop', ...defaultPortsSSL },
    { domain: 'observer-asia.services.mainnet.rchain.coop', ...defaultPortsSSL },
    { domain: 'observer-eu.services.mainnet.rchain.coop', ...defaultPortsSSL },
  ],
}

export interface NodeUrls {
  readonly network: NetworkName
  readonly grpcUrl: string
  readonly httpUrl: string
  readonly httpAdminUrl: string
  readonly statusUrl: string
  readonly getBlocksUrl: string
  // Testnet only
  readonly logsUrl?: string
  readonly filesUrl?: string
}

export const getNodeUrls = function ({name, domain, grpc, http, https, httpAdmin, httpsAdmin, instance}: RNodeInfo): NodeUrls {
  const scheme       = !!https ? 'https' : !!http ? 'http' : ''
  const schemeAdmin  = !!httpsAdmin ? 'https' : !!httpAdmin ? 'http' : ''
  const httpUrl      = !!https || !!http ? `${scheme}://${domain}:${https || http}` : ''
  const httpAdminUrl = !!httpsAdmin || !!httpAdmin ? `${schemeAdmin}://${domain}:${httpsAdmin || httpAdmin}` : ''
  const grpcUrl      = !!grpc ? `${domain}:${grpc}` : ''

  return {
    network      : name as NetworkName,
    grpcUrl,
    httpUrl,
    httpAdminUrl,
    statusUrl    : `${httpUrl}/status`,
    getBlocksUrl : `${httpUrl}/api/blocks`,
    // Testnet only
    logsUrl : instance && `http://${domain}:8181/logs/name:${instance}`,
    // TODO: what0s wrong with files?
    // filesUrl: `http://${domain}:18080`,
  }
}
