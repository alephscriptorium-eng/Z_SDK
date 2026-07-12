# ThreeJS Gamify UI - Layout Refactoring

## Nuevo Sistema Modular

Se ha refactorizado la librería para separar la escena Three.js de los elementos de UI, permitiendo mejor orquestación del layout desde fuera.

## Componentes Disponibles

### 1. Componente de Escena Puro (render-only)

La escena **no** posee sesión. El host alimenta mensajes vía `externalMessages$`.

```typescript
import { ThreeJSScenePureComponent, HubMessage } from '@zeus/threejs-ui-lib';
import { Observable } from 'rxjs';

const sceneConfig = { debugMode: true };
const liveMessages$: Observable<HubMessage> = hostBridge.messages$;
```

**Template:**
```html
<tjs-threejs-scene-pure 
  [config]="sceneConfig"
  [externalMessages$]="liveMessages$"
  [enableDemoFallback]="false"
  (sceneReady)="onSceneReady()"
  (fpsUpdate)="onFpsUpdate($event)">
</tjs-threejs-scene-pure>
```

### 2. Componente de Layout Orquestador
```typescript
import { ThreeJSLayoutComponent, ThreeJSLayoutConfig } from '@zeus/threejs-ui-lib';

const layoutConfig: ThreeJSLayoutConfig = {
  gameTitle: 'Mi Aplicación 3D',
  sceneConfig: { debugMode: true },
  showHeader: true,
  showLeftSidebar: true,
  showRightSidebar: true,
  showControls: true,
  controlsPosition: 'bottom'
};
```

**Template:**
```html
<tjs-threejs-layout
  [config]="layoutConfig"
  [externalMessages$]="liveMessages$">
</tjs-threejs-layout>
```

### 3. Componentes Individuales

#### Escena + Header personalizado
```html
<div class="mi-layout-personalizado">
  <tjs-threejs-header [state]="headerState"></tjs-threejs-header>
  
  <div class="contenido-principal">
    <tjs-threejs-scene-pure [config]="sceneConfig"></tjs-threejs-scene-pure>
  </div>
  
  <tjs-threejs-controls [state]="controlsState" [events]="controlsEvents"></tjs-threejs-controls>
</div>
```

#### Solo la escena (máxima flexibilidad)
```html
<div class="mi-interfaz-personalizada">
  <!-- Tu UI personalizada -->
  <div class="panel-izquierdo">
    <h2>Mi Panel</h2>
    <!-- Tu contenido -->
  </div>
  
  <!-- Solo la escena limpia -->
  <div class="escena-contenedor">
    <tjs-threejs-scene-pure [config]="sceneConfig"></tjs-threejs-scene-pure>
  </div>
  
  <!-- Tu UI personalizada -->
  <div class="panel-derecho">
    <h2>Otro Panel</h2>
    <!-- Tu contenido -->
  </div>
</div>
```

## Migración desde el monolito GEA

El componente monolito `ThreeJSUIComponent` y el wiring AlephScript fueron **eliminados**
(AV-L, block-13). Usar composición modular:

```html
<tjs-threejs-header [state]="headerState"></tjs-threejs-header>
<tjs-threejs-scene-pure
  [config]="sceneConfig"
  [externalMessages$]="liveMessages$">
</tjs-threejs-scene-pure>
<tjs-threejs-controls [state]="controlsState" [events]="controlsEvents"></tjs-threejs-controls>
```

## Casos de Uso
```html
<div class="aplicacion-completa">
  <nav class="navegacion-principal">
    <!-- Tu navegación -->
  </nav>
  
  <main class="contenido-principal">
    <aside class="sidebar">
      <!-- Tus controles personalizados -->
    </aside>
    
    <section class="escena-3d">
      <!-- Solo la escena, sin UI superpuesta -->
      <tjs-threejs-scene-pure 
        [config]="sceneConfig"
        #scene
        (sceneReady)="onSceneReady()">
      </tjs-threejs-scene-pure>
    </section>
    
    <aside class="panel-info">
      <!-- Tu información personalizada -->
      <div class="fps">FPS: {{currentFPS}}</div>
      <button (click)="scene.resetCamera()">Reset Camera</button>
      <button (click)="scene.takeScreenshot()">Screenshot</button>
    </aside>
  </main>
</div>
```

### 2. Configuraciones de Layout

#### Layout Minimalista (solo escena)
```typescript
const minimalConfig: ThreeJSLayoutConfig = {
  gameTitle: 'Escena Minimalista',
  sceneConfig: { debugMode: false },
  showHeader: false,
  showLeftSidebar: false,
  showRightSidebar: false,
  showControls: false
};
```

#### Layout con Controles Flotantes
```typescript
const floatingConfig: ThreeJSLayoutConfig = {
  gameTitle: 'Controles Flotantes',
  sceneConfig: { debugMode: true },
  showHeader: true,
  showLeftSidebar: false,
  showRightSidebar: false,
  showControls: true,
  controlsPosition: 'floating'
};
```

#### Layout Completo
```typescript
const fullConfig: ThreeJSLayoutConfig = {
  gameTitle: 'Aplicación Completa',
  sceneConfig: { debugMode: true },
  showHeader: true,
  showLeftSidebar: true,
  showRightSidebar: true,
  showControls: true,
  controlsPosition: 'bottom'
};
```

## Ventajas del Nuevo Sistema

1. **Separación de Responsabilidades**: La escena 3D está separada del UI
2. **Flexibilidad**: Puedes componer el layout como necesites
3. **Reutilización**: Cada componente puede usarse independientemente
4. **Escalabilidad**: Fácil agregar nuevos tipos de paneles o controles
5. **Personalización**: Máximo control sobre el diseño y posicionamiento

## Integración zeus recomendada

1. Host conecta sesión (`ZeusSessionBridgeService`) y demo offline (`DemoFallbackService`)
2. `merge(zeusMessages$, demoMessages$)` → `[externalMessages$]`
3. Controles outbound (`cast()`) viven en el host, no en la lib
