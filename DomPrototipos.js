/**
 * A DomElement is the main constructor for objects that represent
 * the Dom hierarchy.
 */
function DomElement(type, childrenDefinition) {
    this.type = type;
    this.styles = {};
    this.eventsOn = {};
    this.eventsOff = {};
    this.children = [];

    for (let index = 0; index < (childrenDefinition || []).length; index++) {
        var definition = childrenDefinition[index];
        var newElement = new DomElement(definition.type, definition.children);
        newElement.__proto__ = this;
        if(definition.type === 'h1' || definition.type === 'p' && definition.contents !== undefined){
            newElement.contents = definition.contents;
        }
        this.children.push(newElement);
    }
}

/**
 * All Dom elements know how to print themselves
 */
DomElement.prototype.toString = function(indent) {
    if (!indent) {
        indent = 0;
    }
    var result = ' '.repeat(indent);
    result = result + 'Node ' + this.type + ' {';
    var styleKeys = Object.keys(this.styles);
    for (let index = 0; index < styleKeys.length - 1; index++) {
        var styleKey = styleKeys[index];
        result = result + styleKey + ':' + this.styles[styleKey] + ', '
    }
    if (styleKeys.length > 0) {
        result = result + styleKeys[styleKeys.length - 1] + ':' + this.styles[styleKeys[styleKeys.length - 1]];
    }
    result = result + '}'
    for (let index = 0; index < this.children.length; index++) {
        var element = this.children[index];
        result = result + "\n" + element.toString(indent+2);
    }
    return result;
}


var definition = {
    type: 'html',
    children: [{
        type: 'head'
    }, {
        type: 'body',
        children: [{
            type: 'div',
            children: [{
                type: 'div',
                children: [{
                    type: 'h1',
                    contents: 'Hello World'
                }, {
                    type: 'p',
                    contents: ''
                }, {
                    type: 'p',
                    contents: ''
                }]
            }, {
                type: 'section',
                children: [{
                    type: 'h1',
                    contents: 'Here'
                }, {
                    type: 'p',
                    contents: 'There'
                }, {
                    type: 'p',
                    contents: ''
                }]
            }]
        }, {
            type: 'aside',
            children: [{
                type: 'h1',
                contents: ''
            }, {
                type: 'p',
                contents: ''
            }, {
                type: 'p',
                contents: 'Are you there?'
            }]
        }]
    }]
}

/*
 * La raiz del dom será el primer elemento de nuestras definiciones.
 */
var dom = new DomElement(definition.type, definition.children);

/*
Podemos probar añadir unos estilos y ver que sucede
*/

dom.children[1].styles = {
    background: 'red',
    color: 'blue'
};

dom.children[1].children[0].children[0].styles = {
    size: 17,
    color: 'green'
};

console.log(' ')
console.log(dom.toString());

/**************** PUNTO 1 ******************************/

/*
Queremos poder contar con una definición de estilos como a la siguiente.
*/
var styles = {
    'body section': {
        color: 'green',
        size: 25
    },
    'body': {
        background: 'black'
    },
    'h1': {
        size: 50,
        color: 'red'
    },
    'aside h1': {
        size: 30
    }
};

/*
Estos estilos simulan lo que se leería de un CSS. Y lo que queremos es
poder aplicar todos estilos a nuestro DOM.

El objetivo, es poder aplicar esos estilos a cada elemento del dom
según indique la regla asociada.

Ej. si la regla es "h1", entonces el estilo se aplica a todos los elementos
de tipo h1, pero si es "body h1" entonces se aplica a los h1 que están
dentro de body.

Una característica importante de los estilos es que se heredan según jerarquía.
Si por ejemplo, "body" tiene como estilo color "red", entonces todos los hijos
de body también tendrán color "red", sin necesidad de agregar ese atributo a cada
uno de los hijos.

Por ej. pensemos el siguiente grupo de nodos en el dom

Node html {}
  Node head {}
  Node body {background:red, color:blue}
    Node div {}
      Node div {size:17, color:green}
        Node h1 {}

Si bien h1 no tiene ningún estilo directamente asociado, sus "verdaderos"
estilos son aquellos que surjen de heredar de sus padres.
Entonces h1 tiene los estilos {background:red, size:17, color:green}. El
color es verde ya que si un hijo tiene un estilo que tenía el padre,
lo sobreescribe, de forma similar al overriding.

Entonces haremos primero las siguientes cosas:
a) Agregaremos el método a todo nodo del dom, addStyles, que dada
una definición de estilos que representa un css, asigna los estilos
de esa definición a los correspondientes nodos del DOM.

b) Luego implemente para todo nodo el método getFullStyle que
describe todos los estilos que tiene un nodo (que incluyen los
propios y los heredados).

c) Implemente para todo nodo el método viewStyleHierarchy, que
funciona de forma similar a toString, pero en donde se muestran
absolutamente todos los estilos, incluyendo los heredados, y
no solo aquellos que tienen asociados.
*/


DomElement.prototype.addStyles = function(styles) {
    for(let index = 0; index < this.children.length; index++) {
        var element = this.children[index];
        element.styles = { ...element.styles, ...this.styles };
        if (styles[element.type] || styles[this.type + ' ' + element.type]) {
            element.styles = {...element.styles,...styles[element.type]};
        }
        element.addStyles(styles);
    }
}

DomElement.prototype.getStyle = function(type) {
    for (let i = 0; i < this.children.length; i++) {
        if (this.children[i].type === type && Object.keys(this.children[i].styles).length !== 0) {
            console.log(this.children[i].type, this.children[i].styles);
        }
        if (this.children[i].children.length > 0) {
            this.children[i].getStyle(type);
        }
    }
}

DomElement.prototype.viewStyleHierarchy = function() {
    for(let index = 0; index < this.children.length; index++) {
        var element = this.children[index];
        if(Object.keys(element.styles).length !== 0){
            console.log("viewStyleHierarchy",element.type, element.styles);
        }
        element.viewStyleHierarchy();
    }
}
dom.viewStyleHierarchy();
dom.addStyles(styles);
console.log(dom.toString());
dom.getStyle('div');

dom.viewStyleHierarchy();
/**************** PUNTO 2 ******************************/

/*
Los elementos del DOM en un navegador pueden reaccionar a eventos
que el usuario realiza sobre ellos. Vamos a simular ese proceso.

Para que distintos elementos del DOM puedan reaccionar ante
diversos eventos. Cada elemento del dom debe entender tres
metodos más:

* on(nombreDeEvento, handler)
* off(nombreDeEvento)
* handle(nombreDeEvento)

Por ejemplo, podemos decir

dom.children[1].children[0].children[0].on('click', function() {
    console.log('Se apretó click en html body div div');
    return true;
})

El código de la función queda asociado al evento 'click' para ese
elemento del dom, y se activará cuando se haga el handle del evento.

dom.children[1].children[0].children[0].handle('click');


El tema es que queremos poder usar 'this' en la función para referirnos
al objeto que acaba de hacer el "handle" de la función. Ej.

dom.children[1].children[0].children[0].on('click', function() {
    console.log('Se apretó click en un ' + this.type);
    return true;
})

Esto puede llegar a ser un problema, ya que hay que analizar quién es this,
según el contexto de ejecución. Ojo.

Por otro lado, cuando se hace el handling de un evento, este realiza
el proceso de bubbling-up, es decir, todo padre que también sepa manejar
el evento del mismo nombre debe activar el evento.

Por ejemplo, si activamos 'click' en dom.children[1].children[0].children[0]
y dom.children[1] también sabe manejar 'click', entonces, luego de ejecutar
el 'click' para dom.children[1].children[0].children[0], se deberá hacer el
bubbling-up para que dom.children[1] maneje 'click'.

Hay una excepción, sin embargo. Cuando el handler de un hijo describe falso
luego de ejecutar, el bubbling-up se detiene.

off por su parte, desactiva el handler asociado a un evento.

Se pide entonces que realice los cambios pertinentes para que los elementos
del dom puedan tener este comportamiento.
*/

DomElement.prototype.on = function(event, func) {
    if(this.eventsOff[event]){
        delete this.eventsOff[event];
        
    }
    this.eventsOn = {...this.eventsOn, [event]: func};
    console.log("on", this.eventsOn);
}

DomElement.prototype.off = function(event) {
    if(this.eventsOn[event]){   
        this.eventsOff = {...this.eventsOff, [event]: this.eventsOn[event]};
        delete this.eventsOn[event];
    }
    console.log("off", this.eventsOff);
}

DomElement.prototype.handle = function(event) {
    console.log("tipo", this.type);
    if(this.eventsOn[event]){
        this.eventsOn[event].call(this);
    }
    if(this.__proto__ && this.type !== 'html'){
        this.__proto__.handle(event);
    }
}

dom.children[1].children[0].children[0].on('click', function() {
    console.log('Se apretó click en: ' + this.type);
    return true;
})

dom.children[1].children[0].on('click', function() {
    console.log('Se apretó click en: ' + this.type);
    return true;
})

dom.children[1].on('click', function() {
    console.log('Se apretó click en: ' + this.type);
    return true;
})

dom.children[1].on('fullcolor', function() {
    console.log('Se apretó click en: ' + this.type);
    return true;
})

dom.on('fullcolor', function() {
    console.log('Se apretó click en' + this.type);
    return true;
})
dom.children[1].off('fullcolor');

dom.children[1].children[0].children[0].handle('click');
dom.children[1].on('fullcolor', function() {
    console.log('Se agrego full color ' + this.type);
    return true;
})

dom.children[1].handle('fullcolor');


/**************** PUNTO 3 ******************************/

/*
Queremos poder mostrar los nodos del dom de forma bonita
en la terminal, mediante el metodo display. Es decir,
otra especie de toString para los nodos.

dom.display()

No todo nodo es visible sin embargo. Solo los elementos del body
deben mostrarse en este caso, ya que el head y html son solo
contenedores. Lo mismo ocurre con div, section y aside, que son
elementos contenedores invisibles.

Así, en este caso, solo vamos a mostrar los elementos h1 y p.
Pero ¿Qué mostramos de ellos? Para hacer la cosa más divertida, vamos
a agregar un atributo "contents" a cualquier nodo, que nos permita
agregar un texto a esos elementos como contenido. Ese texto será el
que se muestre cuando llamemos a display.

Más aún, cada elemento se muestra de forma distinta según su tipo.
p muestra contents tal cual, pero h1 lo muestra todo en mayúscula,
siempre.

Además el color del texto y del fondo depende del estilo del elemento,
por lo que vamos a mostrarlo en color en la consola.
(Ver https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color)

Por ejemplo,

Node html {}
  Node head {}
  Node body {background:red, color:blue}
    Node div {}
      Node div {size:17, color:green}
        Node h1 contents="Titulo 1" {}
        Node p contents="Hola mundo" {}
        Node p contents="Esto es un texto" {color: "red"}

Mostraría:

TITULO 1
Hola mundo
Esto es un texto (en rojo)
*/

const color = {
    black : "\x1b[30m",
    red : "\x1b[31m",
    green : "\x1b[32m",
    yellow : "\x1b[33m",
    blue : "\x1b[34m",
    magenta : "\x1b[35m",
    cyan : "\x1b[36m",
    white :"\x1b[37m",

}

function chageStyle(element){
    if(element.type === 'h1' && element.contents !== ''){
        console.log(element.contents.toUpperCase());
    }
    if(element.type === 'p' && element.contents !== ''){
        styles = Object.keys(element.styles);
        console.log(color[element.styles.color],element.contents);
    }
}

DomElement.prototype.display = function() {
    for(let index = 0; index < this.children.length; index++) {
        var element = this.children[index];
        if(element.type === "h1" || element.type === "p"){
            chageStyle(element);
        }
        element.display()
    }
}

dom.display();