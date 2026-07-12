# Compatible Messages Format

Este documento describe los formatos de mensajes JSON compatibles con el sistema de animaciones de ThreeJS-UI-Lib para clientes externos.

## Índice
- [Mensaje Base](#mensaje-base)
- [Tipos de Mensajes](#tipos-de-mensajes)
- [Canales Disponibles](#canales-disponibles)
- [Posiciones de Bots](#posiciones-de-bots)
- [Ejemplos de Implementación](#ejemplos-de-implementación)

## Mensaje Base

Todos los mensajes deben seguir esta estructura base (tipo `HubMessage` en la lib):

```json
{
  "id": "string",
  "fromBot": "string",
  "toBot": "string", 
  "channel": "sys|app|ui|agent|game",
  "content": "string",
  "timestamp": "number",
  "type": "bot-to-center|center-to-bot|bot-to-bot"
}
```

### Campos Obligatorios

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | Identificador único del mensaje |
| `fromBot` | string | Nombre del bot emisor |
| `toBot` | string | Nombre del bot receptor |
| `channel` | string | Canal de comunicación (ver [Canales](#canales-disponibles)) |
| `content` | string | Contenido del mensaje |
| `timestamp` | number | Timestamp UNIX en milisegundos |
| `type` | string | Tipo de mensaje (ver [Tipos](#tipos-de-mensajes)) |

## API canónica: `externalMessages$`

La forma preferida de alimentar la escena es el `@Input() externalMessages$: Observable<HubMessage>`
en `ThreeJSScenePureComponent`. El host (p. ej. `@zeus/operator-ui` con `ZeusSessionBridgeService`)
posee la sesión y el demo offline; la escena solo renderiza.

```typescript
// Host (operator-ui dev-app)
readonly sceneMessages$ = merge(zeusBridge.messages$, demoFallback.messages$);

// Template
<tjs-threejs-scene-pure [externalMessages$]="sceneMessages$"></tjs-threejs-scene-pure>
```

## Tipos de Mensajes

### 1. Bot-to-Center (`bot-to-center`)
Mensaje enviado desde un bot hacia el hub central.

```json
{
  "id": "msg-001",
  "fromBot": "KickBot-Alpha",
  "toBot": "CentralHub",
  "channel": "app",
  "content": "Datos de usuario procesados",
  "timestamp": 1694601234567,
  "type": "bot-to-center"
}
```

**Animación:** Partícula viaja desde la posición del bot hacia el centro de la escena.

### 2. Center-to-Bot (`center-to-bot`)
Mensaje enviado desde el hub central hacia un bot específico.

```json
{
  "id": "msg-002",
  "fromBot": "CentralHub",
  "toBot": "KickBot-Beta",
  "channel": "sys",
  "content": "Actualización de configuración",
  "timestamp": 1694601235567,
  "type": "center-to-bot"
}
```

**Animación:** Partícula viaja desde el centro hacia la posición del bot específico.

### 3. Bot-to-Bot (`bot-to-bot`)
Mensaje directo entre dos bots.

```json
{
  "id": "msg-003",
  "fromBot": "KickBot-Alpha",
  "toBot": "KickBot-Gamma",
  "channel": "agent",
  "content": "Intercambio de datos",
  "timestamp": 1694601236567,
  "type": "bot-to-bot"
}
```

**Animación:** Partícula viaja directamente entre las posiciones de los dos bots.

## Canales Disponibles

Cada canal tiene un color específico en las animaciones:

| Canal | Color | Descripción | Hex Color |
|-------|-------|-------------|-----------|
| `sys` | 🔴 Rojo | Mensajes del sistema | `#ff4444` |
| `app` | 🔵 Azul | Mensajes de aplicación | `#4444ff` |
| `ui` | 🟢 Verde | Mensajes de interfaz | `#44ff44` |
| `agent` | 🟠 Naranja | Mensajes de agentes | `#ffaa44` |
| `game` | 🟣 Púrpura | Mensajes de juego | `#aa44ff` |

### Ejemplo de uso por canal:

```json
// Mensaje de sistema
{
  "id": "sys-001",
  "fromBot": "SystemMonitor",
  "toBot": "CentralHub",
  "channel": "sys",
  "content": "Health check OK ✅",
  "timestamp": 1694601237567,
  "type": "bot-to-center"
}

// Mensaje de aplicación
{
  "id": "app-001", 
  "fromBot": "DataProcessor",
  "toBot": "APIGateway",
  "channel": "app",
  "content": "Datos procesados: 1250 registros",
  "timestamp": 1694601238567,
  "type": "bot-to-bot"
}

// Mensaje de UI
{
  "id": "ui-001",
  "fromBot": "CentralHub", 
  "toBot": "UIRenderer",
  "channel": "ui",
  "content": "Actualizar dashboard 📊",
  "timestamp": 1694601239567,
  "type": "center-to-bot"
}
```

## Posiciones de Bots

Los bots se posicionan automáticamente en un círculo alrededor del hub central. Los nombres de bots reconocidos incluyen:

- `KickBot-Alpha`
- `KickBot-Beta` 
- `KickBot-Gamma`
- `KickBot-Delta`
- `KickBot-Epsilon`
- `CentralHub` (posición central)

### Bots Personalizados

Para bots con nombres personalizados, el sistema calculará automáticamente posiciones en el círculo:

```json
{
  "id": "custom-001",
  "fromBot": "MiBot-Personalizado",
  "toBot": "OtroBot-Custom",
  "channel": "agent",
  "content": "Mensaje entre bots personalizados",
  "timestamp": 1694601240567,
  "type": "bot-to-bot"
}
```

## Ejemplos de Implementación

### JavaScript/TypeScript

```typescript
// Clase para enviar mensajes
class MessageSender {
  private messageCounter = 0;

  sendBotMessage(
    fromBot: string, 
    toBot: string, 
    content: string, 
    channel: 'sys'|'app'|'ui'|'agent'|'game' = 'app'
  ) {
    const message = {
      id: `msg-${++this.messageCounter}`,
      fromBot,
      toBot,
      channel,
      content,
      timestamp: Date.now(),
      type: this.getMessageType(fromBot, toBot)
    };

    // Enviar al sistema de animaciones
    this.sendToAnimationSystem(message);
  }

  private getMessageType(fromBot: string, toBot: string): string {
    if (fromBot === 'CentralHub') return 'center-to-bot';
    if (toBot === 'CentralHub') return 'bot-to-center';
    return 'bot-to-bot';
  }

  private sendToAnimationSystem(message: any) {
    // Implementar envío al sistema de animaciones
    // Ejemplo: WebSocket, HTTP POST, EventEmitter, etc.
  }
}
```

### Python

```python
import json
import time
from typing import Literal

class MessageSender:
    def __init__(self):
        self.message_counter = 0

    def send_bot_message(
        self,
        from_bot: str,
        to_bot: str, 
        content: str,
        channel: Literal['sys', 'app', 'ui', 'agent', 'game'] = 'app'
    ):
        self.message_counter += 1
        message = {
            "id": f"msg-{self.message_counter}",
            "fromBot": from_bot,
            "toBot": to_bot,
            "channel": channel,
            "content": content,
            "timestamp": int(time.time() * 1000),
            "type": self._get_message_type(from_bot, to_bot)
        }
        
        self._send_to_animation_system(message)

    def _get_message_type(self, from_bot: str, to_bot: str) -> str:
        if from_bot == 'CentralHub':
            return 'center-to-bot'
        elif to_bot == 'CentralHub':
            return 'bot-to-center'
        else:
            return 'bot-to-bot'

    def _send_to_animation_system(self, message: dict):
        # Implementar envío al sistema
        json_message = json.dumps(message)
        print(f"Enviando: {json_message}")
```

### Curl/HTTP

```bash
# Ejemplo de envío por HTTP POST
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "id": "curl-001",
    "fromBot": "ExternalSystem",
    "toBot": "CentralHub", 
    "channel": "sys",
    "content": "Mensaje desde sistema externo",
    "timestamp": 1694601241567,
    "type": "bot-to-center"
  }'
```

## Validación de Mensajes

### Schema JSON

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "fromBot", "toBot", "channel", "content", "timestamp", "type"],
  "properties": {
    "id": {
      "type": "string",
      "minLength": 1
    },
    "fromBot": {
      "type": "string",
      "minLength": 1
    },
    "toBot": {
      "type": "string", 
      "minLength": 1
    },
    "channel": {
      "type": "string",
      "enum": ["sys", "app", "ui", "agent", "game"]
    },
    "content": {
      "type": "string"
    },
    "timestamp": {
      "type": "number",
      "minimum": 0
    },
    "type": {
      "type": "string",
      "enum": ["bot-to-center", "center-to-bot", "bot-to-bot"]
    }
  }
}
```

### Función de Validación TypeScript

```typescript
interface MessageFormat {
  id: string;
  fromBot: string;
  toBot: string;
  channel: 'sys'|'app'|'ui'|'agent'|'game';
  content: string;
  timestamp: number;
  type: 'bot-to-center'|'center-to-bot'|'bot-to-bot';
}

function validateMessage(message: any): message is MessageFormat {
  const required = ['id', 'fromBot', 'toBot', 'channel', 'content', 'timestamp', 'type'];
  const channels = ['sys', 'app', 'ui', 'agent', 'game'];
  const types = ['bot-to-center', 'center-to-bot', 'bot-to-bot'];

  // Verificar campos requeridos
  for (const field of required) {
    if (!(field in message)) {
      console.error(`Campo requerido faltante: ${field}`);
      return false;
    }
  }

  // Verificar tipos
  if (typeof message.id !== 'string' || message.id.length === 0) {
    console.error('id debe ser un string no vacío');
    return false;
  }

  if (!channels.includes(message.channel)) {
    console.error(`Canal inválido: ${message.channel}`);
    return false;
  }

  if (!types.includes(message.type)) {
    console.error(`Tipo inválido: ${message.type}`);
    return false;
  }

  if (typeof message.timestamp !== 'number' || message.timestamp < 0) {
    console.error('timestamp debe ser un número positivo');
    return false;
  }

  return true;
}
```

## Mejores Prácticas

### 1. IDs únicos
```typescript
// ✅ Bueno
const id = `${botName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ❌ Malo
const id = "mensaje1";
```

### 2. Timestamps precisos
```typescript
// ✅ Bueno
const timestamp = Date.now(); // Milisegundos

// ❌ Malo  
const timestamp = Math.floor(Date.now() / 1000); // Segundos
```

### 3. Contenido descriptivo
```typescript
// ✅ Bueno
const content = "Usuario autenticado correctamente ✅";

// ❌ Malo
const content = "ok";
```

### 4. Validación antes del envío
```typescript
// ✅ Bueno
if (validateMessage(message)) {
  sendMessage(message);
} else {
  console.error('Mensaje inválido:', message);
}
```

## Integración con WebSockets

### Cliente WebSocket

```typescript
class AnimationWebSocketClient {
  private ws: WebSocket;

  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.setupEventListeners();
  }

  sendMessage(message: MessageFormat) {
    if (validateMessage(message)) {
      this.ws.send(JSON.stringify({
        type: 'animation_message',
        data: message
      }));
    }
  }

  private setupEventListeners() {
    this.ws.onopen = () => {
      console.log('🔗 Conectado al sistema de animaciones');
    };

    this.ws.onmessage = (event) => {
      const response = JSON.parse(event.data);
      console.log('📨 Respuesta:', response);
    };

    this.ws.onerror = (error) => {
      console.error('❌ Error WebSocket:', error);
    };
  }
}

// Uso
const client = new AnimationWebSocketClient('ws://localhost:3001/animations');

client.sendMessage({
  id: 'ws-001',
  fromBot: 'WebSocketBot',
  toBot: 'CentralHub',
  channel: 'app',
  content: 'Conexión WebSocket establecida',
  timestamp: Date.now(),
  type: 'bot-to-center'
});
```

## Troubleshooting

### Problemas Comunes

1. **Mensaje no aparece**
   - Verificar que el timestamp sea válido (no futuro)
   - Confirmar que el canal esté en la lista permitida
   - Revisar que los nombres de bots sean válidos

2. **Color incorrecto de partícula**
   - Verificar el campo `channel` 
   - Consultar la tabla de [Canales Disponibles](#canales-disponibles)

3. **Animación no fluye correctamente**
   - Confirmar que el `type` corresponda con `fromBot` y `toBot`
   - Verificar que no haya campos `null` o `undefined`

### Debug Messages

Para depuración, incluir información adicional:

```json
{
  "id": "debug-001",
  "fromBot": "DebugBot",
  "toBot": "CentralHub",
  "channel": "sys", 
  "content": "DEBUG: Testing message flow",
  "timestamp": 1694601242567,
  "type": "bot-to-center",
  "_debug": {
    "source": "external-system",
    "version": "1.0.0",
    "environment": "development"
  }
}
```

---

## Contacto y Soporte

Para dudas o problemas con la integración:
- Revisar este documento
- Verificar la validación de mensajes
- Consultar los logs del sistema de animaciones
- Usar mensajes de debug para troubleshooting

**Versión del documento:** 1.0.0  
**Última actualización:** Septiembre 2025  
**Compatible con:** ThreeJS-UI-Lib v2.0+
