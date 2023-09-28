////////////////////////////////////// Importancia de las Variables  ///////////////////////////////////////////
// Si desea relativizar la importancia de las variables que el clasificador RF considera en la designacion de las categorias, 
// incorpore estas lineas de codigo al final de la clasificacion. Devuelve en una escala de 0 a 10, la importancia de las bandas, índices e información adicional. 

// Información del Clasificador
print(classifier.explain(), 'Información del Clasificador RF')

// Selecciono la variable importancia y la convierto en tipo diccionario 

var importance = ee.Dictionary(classifier.explain().get('importance'))

// Cálculo la importancia relativa de cada una 

var sum = importance.values().reduce(ee.Reducer.sum())

var relativeImportance = importance.map(function(key, val) {
   return (ee.Number(val).multiply(100)).divide(sum)
  })
print(relativeImportance)

// Convierto esto en una FeatureCollection para poder generar el chart

var importanceFc = ee.FeatureCollection([
  ee.Feature(null, relativeImportance)
])

// Genero el Chart para exportar
//  a pesar de que pueda visualizarse en esta plataforma, recomendamos exportar los datos en .csv para su posterior generación en otro sofware

var chart = ui.Chart.feature.byProperty({
  features: importanceFc
}).setOptions({
      title: 'Importancia de cada banda en el Stack',
      vAxis: {title: 'Importancia', minValue: 0},
      hAxis: {title: 'Banda', maxValue: 10},
      legend: {position: 'none'},
      })

Export.table.toDrive(importanceFc, 'ImportanciaVariables_Exportacion') 

print(chart, 'Importancia de las Variables')