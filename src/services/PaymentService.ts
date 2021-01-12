import IProducto from '../producto/producto.interface';
import mercadopago from 'mercadopago';
import { IsCurrency } from 'class-validator';
class PaymentService {
  tokensMercadoPago: any;
  // declaramos la url en el constructor para poder accederla a lo largo de toda la clase
  // mercadoPagoUrl = 'https://api.mercadopago.com/checkout';

  constructor() {
    // declaramos de la siguiente manera el token, para que sea más fácil cambiarlo dependiendo del ambiente
    const { MERCADO_TOKEN } = process.env;
    // this.tokensMercadoPago = {
    //   prod: {},
    //   test: {
    //     // Token de produccion del vendedor
    //     access_token:
    //       'APP_USR-2369082329741393-120900-f0d508574cddf988b11935fb0203de9c-684788846', // el access_token de MP
    //   },
    // };
  }

  async createPaymentMercadoPago(
    ordenId:string,
    productosOrden: {
      producto: IProducto;
      problemasStock: boolean;
      cantidad: number;
      subtotal: number;
    }[],
    cliente: {
      email: string;
      nombre: string;
      apellido: string;
      codigoArea: number;
      telefono: number;
      dni: number;
    }
  ) {
    console.log('1', productosOrden);
    console.log('2', cliente);
    // recibimos las props que le mandamos desde el PaymentController
    // const url = `${this.mercadoPagoUrl}/preferences?access_token=${this.tokensMercadoPago.test.access_token}`;
    // url a la que vamos a hacer los requests
    const { URL_FRONT, URL, ENTORNO, MERCADO_EMAIL_CLIENTE } = process.env;
    const items = productosOrden.map((x) => {
      console.log('3', x);
      return {
        // id interno (del negocio) del item
        id: x.producto._id,
        // nombre que viene de la prop que recibe del controller
        title: x.producto.titulo,
        // descripción del producto
        description: x.producto.titulo,
        // url de la imágen del producto
        picture_url: URL + x.producto.imagenes[0].src,
        // categoría interna del producto (del negocio)
        category_id: 'others',
        // cantidad, que tiene que ser un intiger
        quantity: x.cantidad,
        // el precio, que por su complejidad tiene que ser tipo FLOAT
        unit_price: parseFloat(
          x.producto.precioOferta
            ? x.producto.precioOferta.toString()
            : x.producto.precio.toString()
        ),
        // id de la moneda, que tiene que ser en ISO 4217
        currency_id: 'ARS' as any,
      };
    });
    console.log('4. items', items);
    const preferences = {
      // declaramos las preferencias de pago
      items,
      // el array de objetos, items que declaramos más arriba
      external_reference: ordenId.toString(),
      // referencia para identificar la preferencia, puede ser practicamente cualquier valor
      payer: {
        // información del comprador, si estan en producción tienen que //traerlos del request
        //(al igual que hicimos con el precio del item)
        name: cliente.nombre,
        surname: cliente.apellido,
        // email: ENTORNO === 'desarrollo' ? MERCADO_EMAIL_CLIENTE : cliente.email,
        email: 'test_user_36248975@testuser.com',
        // si estan en sandbox, aca tienen que poner el email de SU usuario de prueba
        phone: {
          area_code: cliente.codigoArea.toString(),
          number: cliente.telefono as any,
        },
        address: {
          zip_code: '1111',
          street_name: 'False',
          street_number: 123 as any,
        },
      },
      payment_methods: {
        // declaramos el método de pago y sus restricciones
        excluded_payment_methods: [
          // aca podemos excluir metodos de pagos, tengan en cuenta que es un array de objetos
          {
            id: 'amex',
          },
        ],
        excluded_payment_types: [{ id: 'atm' }],
        // aca podemos excluir TIPOS de pagos, es un array de objetos
        installments: 6,
        // limite superior de cantidad de cuotas permitidas
        default_installments: 6,
        // la cantidad de cuotas que van a aparecer por defecto
      },
      back_urls: {
        // declaramos las urls de redireccionamiento
        success: URL_FRONT + '/checkout/success',
        // url que va a redireccionar si sale todo bien
        pending: URL_FRONT + '/checkout/pending',
        // url a la que va a redireccionar si decide pagar en efectivo por ejemplo
        failure: URL_FRONT + '/checkout/error',
        // url a la que va a redireccionar si falla el pago
      },
      notification_url: 'http://66.97.41.7:5000/ordenes/webhook',
      // notification_url: URL+'/ordenes/webhook',
      // declaramos nuestra url donde recibiremos las notificaciones
      auto_return: 'approved' as 'approved',
      // si la compra es exitosa automaticamente redirige a "success" de back_urls
      statement_descriptor: 'PROPET Tienda de Mascotas',
    };
    console.log('5. preferences', preferences);

    try {
      const resultado = await mercadopago.preferences.create(preferences);
      console.log('resultado', resultado);
      return resultado;
    } catch (e) {
      console.log(e);
      return null;

      // mostramos error en caso de que falle el POST
    }
    // try {
    //   const request = await axios.post(url, preferences, {
    //     // hacemos el POST a la url que declaramos arriba, con las preferencias
    //     headers: {
    //       // y el header, que contiene content-Type
    //       'Content-Type': 'application/json',
    //     },
    //   });

    //   return request.data;
    //   // devolvemos la data que devuelve el POST
    // } catch (e) {
    //   console.log(e);
    //   // mostramos error en caso de que falle el POST
    // }
  }
}

//NOTA: TODAS las URLS que usemos tienen que ser reales,
//si prueban con localhost, va a fallar

// module.exports = PaymentService;

export default PaymentService;
