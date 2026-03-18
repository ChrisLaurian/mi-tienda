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
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
