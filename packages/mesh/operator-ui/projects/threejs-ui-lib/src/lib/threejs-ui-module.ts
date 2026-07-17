import { NgModule } from '@angular/core';
import { ThreeJSScenePureComponent } from './components/threejs-scene-pure.component';
import { ThreeJSLayoutComponent } from './components/threejs-layout.component';
import { ThreeJSControlsComponent } from './components/threejs-controls.component';
import { ThreeJSHeaderComponent } from './components/threejs-header.component';
import { ThreeJSSidebarLeftComponent } from './components/threejs-sidebar-left.component';
import { ThreeJSSidebarRightComponent } from './components/threejs-sidebar-right.component';

@NgModule({
  imports: [
    ThreeJSScenePureComponent,
    ThreeJSLayoutComponent,
    ThreeJSControlsComponent,
    ThreeJSHeaderComponent,
    ThreeJSSidebarLeftComponent,
    ThreeJSSidebarRightComponent,
  ],
  exports: [
    ThreeJSScenePureComponent,
    ThreeJSLayoutComponent,
    ThreeJSControlsComponent,
    ThreeJSHeaderComponent,
    ThreeJSSidebarLeftComponent,
    ThreeJSSidebarRightComponent,
  ],
})
export class ThreeJSUIModule {}
