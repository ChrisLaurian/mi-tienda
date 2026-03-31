export const environment = {
  production: true,
  woocommerce: {
    url: 'https://appprot.whapruebas.com',
    consumerKey: 'ck_a42e54dee022e07234e930cfdd3c6cf883a24a48',
    consumerSecret: 'cs_500dc3cff7fb6f0dc3703ae555c5bf7975417b8f',
    sites: [
      { id: 'main', name: 'Principal', url: 'https://appprot.whapruebas.com', usaIndexPhp: true, authMode: 'query' as const }
    ],
    defaultSiteId: 'main' as string
  }
} as const;
