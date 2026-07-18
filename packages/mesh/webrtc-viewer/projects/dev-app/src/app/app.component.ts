/**
 * Angular host bootstrap placeholder (hermano operator-ui dev-app).
 * Runtime preferido hasta `ng build`: ESM shell en serve.mjs.
 */
import { Component } from '@angular/core';
import { PeerListComponent } from '../../webrtc-ui-lib/src/lib/features/peer-list/peer-list.component';
import { MediaControlsComponent } from '../../webrtc-ui-lib/src/lib/features/media-controls/media-controls.component';
import { ChatComponent } from '../../webrtc-ui-lib/src/lib/features/chat/chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PeerListComponent, MediaControlsComponent, ChatComponent],
  template: `
    <h1>Zeus WebRTC</h1>
    <wrtc-media-controls></wrtc-media-controls>
    <wrtc-peer-list></wrtc-peer-list>
    <wrtc-chat></wrtc-chat>
  `
})
export class AppComponent {}
