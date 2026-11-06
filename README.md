# Ahumados Don Jocé — Carta digital con carrito

Sitio web listo para subir a **GitHub Pages**, con diseño adaptativo para celular y computadora, productos, carrito persistente, ventana de confirmación y formulario de pedido que compone el mensaje para WhatsApp. Desarrollado para Ahumados Don Jocé. **Web hecha por Agencia Blink.**

## 1. Antes de publicar: configurar el WhatsApp (IMPORTANTE)

En el archivo **`datos/config.js`** cambiar:

```js
telefonoWhatsApp: '',
```

por el número **real del negocio** en formato internacional sin espacios (Perú: **51** seguido de **9 dígitos**). Por ejemplo, `51` + `9XXXXXXXX`. Sin este cambio, el sitio muestra el catálogo y permite armar y copiar el pedido, pero **no puede enviarlo a un negocio**. No se ha inventado ningún número.

En este mismo archivo se puede definir `costoDelivery` (por defecto `null`: por confirmar) y, cuando existan, los perfiles sociales `instagram`, `facebook` y `tiktok`. Actualmente llevan a las páginas generales de las respectivas redes.

## 2. Editar productos, precios y fotos

- **`datos/productos.js`**: edita `nombre`, `categoria`, `precio`, `descripcion`, `imagen`, `etiqueta`. Los importes son números en **soles** sin símbolo (por ejemplo `29`). Para precios faltantes, usa `null`, que muestra **«Precio por consultar»**.
- **`img/productos/p01.webp` … `p09.webp`**: fotografías **referenciales generadas para esta maqueta**, sin etiquetas, envases ni marcas. **Sustituye estas imágenes por fotografías reales de los artículos vendidos antes del lanzamiento comercial**; el contenido visual puede diferir del producto real. Conserva los nombres y extensión de archivo para reemplazarlas sin tocar el código (tamaño recomendado 1200 × 800 px en WebP).
- **`img/logo/ahumados-don-joce.webp`**: recorte del logo que se adjuntó. El logo original también está incluido en el banner mediante `img/logo/logo-transparente.png`, recortado con fondo transparente, y en la cabecera se usa un distintivo tipográfico legible.

**Precios cargados (del mensaje recibido):** Cecina roja S/29; semi natural S/30; natural S/30; chorizo rojo S/19; chorizo natural S/20. **Pendientes:** manteca, chicharróncito, costillas ahumadas y cuerito de cerdo ahumado.

**Importante:** no se especificó si el precio es por kg, por medio kg, unidad o paquete; por eso no se inventan unidades. Confirma y añade presentaciones si hace falta.

## 3. Publicar en GitHub Pages

1. Crea un repositorio en GitHub (por ejemplo `ahumados-don-joce`).
2. Descomprime el ZIP. **Sube directamente el contenido de la carpeta** (el `index.html` debe quedar en la raíz del repositorio), manteniendo `css/`, `js/`, `datos/` e `img/`.
3. En el repositorio entra a **Settings → Pages → Build and deployment**. En **Source** elige `Deploy from a branch`, rama `main`, carpeta `/(root)`; guarda.
4. Abre el enlace que GitHub Pages publique cuando el despliegue termine. Revisa el WhatsApp del negocio y realiza una compra de prueba.

No es necesario instalar Node.js, dependencias, bases de datos ni configurar servidores.

## 4. Cómo funciona el pedido

- Escoge categoría, busca o entra a la ficha de un producto, ajusta cantidad y pulsa **Agregar**.
- Aparece una ventana: **Confirmar pedido** abre el carrito y **Seguir comprando** vuelve a los productos.
- Dentro del carrito se pueden sumar, restar y eliminar artículos.
- Completa nombre, celular, modalidad de entrega, dirección y referencia para delivery, pago y notas adicionales.
- La web crea un resumen con subtotal conocido, productos por consultar y delivery por confirmar; el cliente abre WhatsApp para enviar el mensaje. **Esto no constituye confirmación de venta ni pago automático**.
- Los productos y las cantidades permanecen guardados en el navegador mediante `localStorage`.

## 5. Carpetas

```text
ahumados-don-joce/
├── index.html
├── css/
│   └── estilos.css
├── js/
│   └── app.js
├── datos/
│   ├── config.js
│   └── productos.js
├── img/
│   ├── logo/
│   │   ├── ahumados-don-joce.webp
│   │   ├── logo-transparente.png
│   │   └── portada-social.jpg
│   ├── iconos/
│   │   └── favicon.svg
│   └── productos/
│       ├── p01.webp
│       ├── p02.webp
│       ├── ...
│       └── p09.webp
└── README.md
```

## 6. Consideraciones técnicas

- Interfaz estática en HTML, CSS y JS. Compatible con alojamiento estático de GitHub Pages.
- Responsive, modal con navegación por teclado y soporte para `prefers-reduced-motion`.
- Validación del formulario para celulares peruanos, sin backend ni manejo de pagos con tarjetas.
- El botón social redirige al sitio público de cada red hasta que se agreguen cuentas reales.
- Las fuentes se cargan de Google Fonts, pero hay tipografías alternativas si no se dispone de conexión. Todas las fotos del catálogo se incluyen localmente en `img/productos/`.
- El archivo `img/logo/portada-social.jpg` es un recurso visual para compartir, pero una vista previa externa puede requerir una URL absoluta en el `og:image` una vez se conozca el dominio final.
- Si vendes productos por peso, agrega selección de presentaciones/precios en el JS antes de publicar; esta versión maneja cantidades de la presentación definida por el negocio, que aún debe confirmarse.

## 7. Créditos visuales

Logo proporcionado por el cliente. Imágenes de producto generadas como material referencial para la maqueta del sitio y no fotografías certificadas del inventario real. No se copiaron fotografías de terceros desde internet.
