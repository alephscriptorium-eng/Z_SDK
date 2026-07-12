/*
 * Public API Surface of threejs-ui-lib
 */

export * from './lib/threejs-ui-module';

// Modular components
export * from './lib/components/threejs-scene-pure.component';
export * from './lib/components/threejs-layout.component';
export * from './lib/components/threejs-controls.component';
export * from './lib/components/threejs-header.component';
export * from './lib/components/threejs-sidebar-left.component';
export * from './lib/components/threejs-sidebar-right.component';

// Services
export * from './lib/shared/services/modal.service';

// Three.js facades (@zeus/ui-3d-kit)
export * from './lib/shared/three/kit-scene.facade';
export * from './lib/shared/three/kit-trajectory.facade';
export * from './lib/shared/three/kit-animation.facade';

// Shared components
export * from './lib/shared/components/demo-controls.component';
export * from './lib/shared/components/visual-controls.component';
export * from './lib/shared/components/modal-manager.component';

// Feature components
export * from './lib/features/bot-management/bot-list.component';
export * from './lib/features/message-panel/message-panel.component';

// Types and interfaces
export * from './lib/shared/models/bot.model';
export * from './lib/shared/models/message.model';

// Simulation (host may use for offline demo fallback)
export * from './lib/shared/simulation/demo-message-simulator';
