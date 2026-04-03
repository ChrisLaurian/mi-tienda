export const environment = {
  production: false,
  woocommerce: {
    url: 'https://appprot.whapruebas.com',
    consumerKey: 'ck_a42e54dee022e07234e930cfdd3c6cf883a24a48',
    consumerSecret: 'cs_500dc3cff7fb6f0dc3703ae555c5bf7975417b8f',
    sites: [
      { id: 'main', name: 'Principal', url: 'https://appprot.whapruebas.com', usaIndexPhp: true, authMode: 'query' },
      { id: 'test', name: 'Test', url: 'https://appprot.whapruebas.com/test', usaIndexPhp: true, authMode: 'query' },
      { id: 'test2', name: 'Test 2', url: 'https://appprot.whapruebas.com/test2', usaIndexPhp: true, authMode: 'query' },
    ],
    defaultSiteId: 'main',
    pluginApi: {
      namespace: 'flexi-options/v1',
      categoryTopicsPath: '/{namespace}/topics/{id}'
    },
    pluginTopics: {
      fruits: {
        label: 'Frutas',
        categoryNames: ['producto', 'frutas'],
        type: 'checkbox',
        options: [
          { id: 'platano', label: 'Plátano' },
          { id: 'manzana', label: 'Manzana' },
          { id: 'melon', label: 'Melón' }
        ]
      }
    }
  },
  woocommerceSites: [
    { 
      id: 'main', 
      name: 'Principal', 
      url: 'https://appprot.whapruebas.com', 
      usaIndexPhp: false, 
      authMode: 'header' as const,
      consumerKey: 'ck_a42e54dee022e07234e930cfdd3c6cf883a24a48',
      consumerSecret: 'cs_500dc3cff7fb6f0dc3703ae555c5bf7975417b8f'
    },
    { 
      id: 'test', 
      name: 'Sucursal Norte', 
      url: 'https://appprot.whapruebas.com/test', 
      usaIndexPhp: true, 
      authMode: 'query' as const,
      consumerKey: 'ck_5581d1b5b5324263a1b0be4848232ca4dc75d3cb',
      consumerSecret: 'cs_5da98a776949b68010dd65319c77ee1b78a29078'
    },
    { 
      id: 'test2', 
      name: 'Sucursal Sur', 
      url: 'https://appprot.whapruebas.com/test2', 
      usaIndexPhp: true, 
      authMode: 'query' as const,
      consumerKey: 'ck_1a4a9a7c29f04f0966209ce15b1492b6ecf0cbf0',
      consumerSecret: 'cs_bf8a45ebbf503d82596e874d567d40b3de28e196'
    },
  ],
  woocommerceDefaultSiteId: 'main'
};
