////////////////////////////////////// Código de Clasificación Supervisada (RF) por Provincia  - IGN //////////////////////////////////////////////

//Licencia de uso: Instituto Geografico Nacional 
//Importación de Assets

var sar = ee.ImageCollection("COPERNICUS/S1_GRD"), // Imagenes Sentinel SAR 1-GRD 
    table = ee.FeatureCollection("projects/ee-gonzalodgign/assets/RegionesArgentina/provincias"), // Shape con Provincias
    DEM = ee.Image("USGS/SRTMGL1_003") // DEM del repositorio Google Earth Engine con una resolución de 30m 
    muestras_sj = ee.FeatureCollection("projects/ee-aplicacionesgeoespaciales/assets/muestras_sj") // Shape de muestras ejemplo para la provincia de SJ
;

// Estilos //

// Color de las Categorías

var N1Color = [
  '#0000ff',//Cuerpo de Agua -class 1
  '#3ADEDC',//Nieve - class 2
  '#0d730d',//Bosque, selva - class 3
  '#fff8dc',//Estepa Arbustiva - class 4
  '#52ff00',//Tierra para Cultivo - class 5
  '#6B5247',//Afloramiento rocoso - class 6
  '#a10684',//Humedal - class 7
  '#5D6D7E',//Salar - class 8
  '#f39f18',//Médano, duna - class 9
  '#A8B349',//Pastizal - class 10
  '#671EDE',//Monte - class 11
];
  
// Visualización de la colección en color natural

var bandas = ['B4_mean','B3_mean','B2_mean'];
var color_natural = {bands: bandas, min: 0, max: 5000};

var bandas2 = ['B4','B3','B2'];
var color_natural2 = {bands: bandas2, min: 0, max: 5000};

//////////////////// Ubicacion //////////////////////////////
// Seleccionar en la variable area, tal como se observa en la línea 43, la provincia a clasificar
// Recordar que GEE tiene un límite de procesamiento en la nube por lo que si intenta clasificar un área grande puede dar error según disponibilidad 
// de servidores

// Modificar el nombre de la provincia que se quiera clasificar

var area = table.filter(ee.Filter.eq("nam","San Juan")); // ! SELECCIONAR PROVINCIA !

// Agrego al mapa el shape de la provincia y centro la visualización

Map.addLayer(area, {}, 'area')
Map.centerObject(area, 6)

//////////////////// Coleccion de imagenes ///////////////////

// SENTINEL 2A/B - Nivel de preprocesamiento 1C

var s2c_01= ee.ImageCollection("COPERNICUS/S2")
.filterDate('2021-01-01', '2021-12-31') 
.filterBounds(area) 
.filterMetadata('CLOUDY_PIXEL_PERCENTAGE', 'less_than', 0.3); // Seleccionar % de Nubes

// SENTINEL 1 - Imagenes Radar banda C

var sar_vh = ee.ImageCollection(sar) // Banda doble de polarización cruzada, transmisión vertical/recepción horizontal 
.filterDate('2021-01-01', '2021-12-31')
.filterBounds(area)
.filter(ee.Filter.eq('instrumentMode', 'IW'))
.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
.select('VH').mean()
.rename('VH_mean')

var sar_vv = ee.ImageCollection(sar) // Banda de polarización, tranmisión vertical/recepción vertical
.filterDate('2021-01-01', '2021-12-31')
.filterBounds(area)
.filter(ee.Filter.eq('instrumentMode', 'IW'))
.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
.select('VV').mean()
.rename('VV_mean')

/////////////////// Indices Espectrales ////////////////////

// Se reducen los valores de la colección de SENTINEL por los valores estadísticos: media, min y max

// Media

var s2c_2 = s2c_01.reduce(ee.Reducer.mean())

Map.addLayer(s2c_2, color_natural, 'Coleccion color Natural'); // Se agrega las imagenes en colección natural al mapa

// Minima

var s2c_min = s2c_01.reduce(ee.Reducer.min())

// Máxima

var s2c_max = s2c_01.reduce(ee.Reducer.max())

// Se cálculan los índices a partir de los valores anteriores 

// Normalized Difference Vegetation Index (NDVI) = (B8 - B4) / (B8 + B4)

var NDVI= s2c_2.normalizedDifference(['B8_mean','B4_mean']).rename('NDVImean')

var NDVImin = s2c_min.normalizedDifference(['B8_min', 'B8_min']).rename('NDVImin')

var NDVImax = s2c_max.normalizedDifference(['B8_max', 'B8_max']).rename('NDVImax')

var NDVIrango = NDVImax.subtract(NDVImin).rename('NDVIrango')

// Normalized Difference Water Index (NDWI) = (B8 - B3) / (B8 + B3)

var NDWI= s2c_2.normalizedDifference(['B3_mean','B8_mean']).rename('NDWImean')

var NDWImin = s2c_min.normalizedDifference(['B3_min','B8_min']).rename('NDWImin')

var NDWImax = s2c_max.normalizedDifference(['B3_max','B8_max']).rename('NDWImax')

var NDWIrango = NDWImax.subtract(NDWImin).rename('NDWIrango')

//Bare Soil Index (BSI) = (B11 + B4) – (B8 + B2) / (B11 + B4) + (B8 + B2)

// Media

var T1_1= s2c_2.select('B11_mean');
var T1_2= s2c_2.select('B4_mean');
var T1_3= s2c_2.select('B8_mean');
var T1_4=s2c_2.select('B2_mean');
var b11addb4=T1_1.add(T1_2);
var b8addb2=T1_3.add(T1_4);
var termino1=b11addb4.subtract(b8addb2);
var termino2= b11addb4.add(b8addb2);
var BSI= termino1.divide(termino2).rename("BSImean");

// Min

var T2_1= s2c_min.select('B11_min');
var T2_2= s2c_min.select('B4_min');
var T2_3= s2c_min.select('B8_min');
var T2_4=s2c_min.select('B2_min');
var b11addb4_2=T2_1.add(T2_2);
var b8addb2_2=T2_3.add(T2_4);
var termino1_2=b11addb4_2.subtract(b8addb2_2);
var termino2_2= b11addb4_2.add(b8addb2_2);

var BSImin= termino1_2.divide(termino2_2).rename("BSImin");

// Max

var T3_1= s2c_max.select('B11_max');
var T3_2= s2c_max.select('B4_max');
var T3_3= s2c_max.select('B8_max');
var T3_4= s2c_max.select('B2_max');
var b11addb4_3=T3_1.add(T3_2);
var b8addb2_3=T3_3.add(T3_4);
var termino1_3=b11addb4_3.subtract(b8addb2_3);
var termino2_3= b11addb4_3.add(b8addb2_3);

var BSImax= termino1_3.divide(termino2_3).rename("BSImax");

//Rango

var BSIrango = BSImax.subtract(BSImin).rename('BSIrango')

// Enhanced Vegetation Index (EVI2)

var EVI = s2c_2.expression(
  '2.4*((NIR-RED)/(NIR+RED+1))',{
    'NIR':s2c_2.select('B8_mean'),
    'RED':s2c_2.select('B4_mean'),
}).rename('EVI2mean'); 
  
// Min  

var EVImin = s2c_min.expression(
  '2.4*((NIR-RED)/(NIR+RED+1))',{
    'NIR':s2c_min.select('B8_min'),
    'RED':s2c_min.select('B4_min'),
}).rename('EVI2min');
  
// Max

var EVImax = s2c_max.expression(
  '2.4*((NIR-RED)/(NIR+RED+1))',{
    'NIR':s2c_max.select('B8_max'),
    'RED':s2c_max.select('B4_max'),
}).rename('EVI2max')

//Rango

var EVIrango = EVImax.subtract(EVImin).rename('EVI2rango')

// Digital Elevation Model (DEM)

var DEM = DEM.rename('DEM').clip(area);

// Bandas del visible e Infrarrojo

var visibleinf = s2c_2.select(['B2_mean', 'B3_mean','B4_mean', 'B8_mean', 'B11_mean']);

// Normalized Difference Snow Index (NDSI) = (Green-SWIR) / (Green+SWIR)

var ndsi= s2c_2.expression(
  '(GREEN - SWIR ) / (GREEN  + SWIR )',{
    'GREEN':s2c_2.select('B3_mean'),
    'SWIR':s2c_2.select('B11_mean'),
}).rename('NDSImean');
  
// Min

var NDSImin= s2c_min.expression(
  '(GREEN - SWIR ) / (GREEN  + SWIR )',{
    'GREEN':s2c_min.select('B3_min'),
    'SWIR':s2c_min.select('B11_min'),
}).rename('NDSImin');
  
// Max

var NDSImax= s2c_max.expression(
  '(GREEN - SWIR ) / (GREEN  + SWIR )',{
    'GREEN':s2c_max.select('B3_max'),
    'SWIR':s2c_max.select('B11_max'),
}).rename('NDSImax');

// Rango

var NDSIrango = NDSImax.subtract(NDSImin).rename('NDSIrango')

// Soil Adjusment Vegatation Index (SAVI) = [ (NIR - red ) / (NIR + red + L) ] ×(I+L)

// Media

var savi= s2c_2.expression(
  'NIR-RED/(NIR+RED+0.5)*(1+0.5)',{
    'NIR':s2c_2.select('B8_mean'),
    'RED':s2c_2.select('B4_mean'),
}).rename('SAVImean'); 
  
// Min

var SAVImin= s2c_min.expression(
  'NIR-RED/(NIR+RED+0.5)*(1+0.5)',{
    'NIR':s2c_min.select('B8_min'),
    'RED':s2c_min.select('B4_min'),
}).rename('SAVImin'); 

// Max

var SAVImax= s2c_max.expression(
  'NIR-RED/(NIR+RED+0.5)*(1+0.5)',{
    'NIR':s2c_max.select('B8_max'),
    'RED':s2c_max.select('B4_max'),
}).rename('SAVImax'); 
  
// Rango

var SAVIrango = SAVImax.subtract(SAVImin).rename('SAVIrango')

// Normalized Difference Moisture Index (NDMI) = (B08 - B11) / (B08 + B11)

// Media

var NDMImean = s2c_2.normalizedDifference(['B8_mean','B11_mean']).rename('NDMImean')

// Min

var NDMImin = s2c_min.normalizedDifference(['B8_min', 'B11_min']).rename('NDMImin')

// Max

var NDMImax = s2c_max.normalizedDifference(['B8_max', 'B11_max']).rename('NDMImax')

// Rango

var NDMIrango = NDMImax.subtract(NDMImin).rename('NDMIrango')

// Stack para la clasificación
// Se crea una imagen única con todas las bandas espectrales, los índices calculados y el DEM

var stackarea= ee.Image(NDVI)
.addBands(NDVImin)
.addBands(NDVImax)
.addBands(NDVIrango)
.addBands(NDWI)
.addBands(NDWImin)
.addBands(NDWImax)
.addBands(NDWIrango)
.addBands(BSI)
.addBands(BSImin)
.addBands(BSImax)
.addBands(BSIrango)
.addBands(visibleinf)
.addBands(sar_vh)
.addBands(DEM)
.addBands(sar_vv)
.addBands(ndsi)
.addBands(NDSImin)
.addBands(NDSImax)
.addBands(NDSIrango)
.addBands(EVI)
.addBands(EVImin)
.addBands(EVImax)
.addBands(EVIrango)
.addBands(savi)
.addBands(SAVImin)
.addBands(SAVImax)
.addBands(SAVIrango)
.addBands(NDMImean)
.addBands(NDMImin)
.addBands(NDMImax)
.addBands(NDMIrango)

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////// Clasificación RANDOM FOREST //////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Muestras (Incorporar shape desde "Assets" o tomar las muestras directamente desde GEE)
var muestras = muestras_sj.filterBounds(area) // ! Reemplazar "muestras_sj" por el shape con las muestras, donde debera poseer una columna "class" con el número de categoría !

var muestras_1 = muestras.randomColumn('random') // A esas muestras se le asigna una columna aleatoria para luego poder dividir en 70/30

Export.table.toDrive(muestras_1, 'Muestras_Exportación')

// Division de muestras
// se separa un 70% de las muestras para realizar la clasificación y un 30% para la validación del clasificador

var entrenamiento = muestras_1.filter(ee.Filter.lt('random', 0.7))
var validacion = muestras_1.filter(ee.Filter.gt('random', 0.7))

Export.table.toDrive(entrenamiento, 'Descarga_Entrenamiento')
Export.table.toDrive(validacion, 'Descarga_Validacion')

var training = stackarea.sampleRegions({
  collection:entrenamiento,
  properties:['class', 'random'],
  scale:30
})

// Bandas a utilizar en la clasificación

var bandas_sel = ['NDVImean', 'NDVImin', 'NDVImax', 'NDVIrango', 'NDWImean', 'NDWImin', 'NDWImax', 'NDWIrango', 'BSImean', 'BSImin', 'BSImax', 'BSIrango', 'EVI2mean', 'EVI2min', 'EVI2max', 'EVI2rango', 'DEM', 'B2_mean', 'B3_mean', 'B4_mean', 'B8_mean', 'B11_mean', 'VH_mean', 'VV_mean', 'NDSImean', 'NDSImin', 'NDSImax', 'NDSIrango', 'SAVImean', 'SAVImin', 'SAVImax', 'SAVIrango', 'NDMImean', 'NDMImin', 'NDMImax', 'NDMIrango']                              

// Entreno al Clasificador RF

var classifier = ee.Classifier.smileRandomForest(300) // El n° indica la candidad de árboles que se van a generar y tiene implicancia en la velocidad de procesamiento
.train({
  features: training,
  classProperty: 'class',
  inputProperties: bandas_sel
})

// Clasifico la imagen

var classified = stackarea.classify(classifier)

Map.addLayer(classified, {min:1, max: 11, palette: N1Color}, 'RF Classification') // Agrego el resultado al mapa con la paleta de colores definida previamente. 

// Matriz de Confusion y Precision

var test = classified.sampleRegions({
  collection: validacion,
  properties: ['class'],
  scale:30
})
  
var testConfusionMatrix = test.errorMatrix('class', 'classification')

print('Matrix de confusión' , testConfusionMatrix);
print('RF Precisión', testConfusionMatrix.accuracy());
print('Coeficiente Kappa', testConfusionMatrix.kappa())

//////////////////////////////////////  Leyendas para el Mapa  /////////////////////////////////////////

var legend = ui.Panel({style: {position: 'bottom-left',padding: '8px 15px'}});
var legendTitle = ui.Label({value: 'Categorías', style: {fontWeight: 'bold',fontSize: '18px',margin: '0 0 4px 0',padding: '0'}
});
legend.add(legendTitle);
var makeRow = function(color, name) {
var colorBox = ui.Label({style: {backgroundColor: '#' + color,padding: '8px',margin: '0 0 4px 0'}
});

var description = ui.Label({value: name,style: {margin: '0 0 4px 6px'}});
return ui.Panel({widgets: [colorBox, description],layout: ui.Panel.Layout.Flow('horizontal')});
};
var palette = ['0000ff','3ADEDC','0d730d','fff8dc','52ff00','6B5247','a10684','5D6D7E','f39f18','A8B349', '671EDE'];
var names = ['1. Cuerpo de Agua', '2. Nieve', '3. Bosque, selva', '4. Estepa arbustiva', '5. Terreno para cultivo', '6. Afloramiento rocoso', '7. Humedal', '8. Salar, salina o boratera', '9. Médano, duna', '10. Pastizal', '11. Monte'];
for (var i = 0; i < 11; i++) {legend.add(makeRow(palette[i], names[i]));}  

Map.add(legend);

///////////////////////////////////// Exportación ///////////////////////////////////////////////////

Export.image.toDrive({
  image: classified,
  description: 'Clasificacion_Exportacion',
  scale: 30,
  region: area,
  maxPixels: 872093662, // Si la exportación da error por n° de px, cambiar por el número que indica en esta línea. 
});