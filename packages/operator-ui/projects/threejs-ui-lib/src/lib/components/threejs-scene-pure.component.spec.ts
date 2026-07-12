import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { ThreeJSScenePureComponent } from './threejs-scene-pure.component';
import { KitSceneFacade } from '../shared/three/kit-scene.facade';
import { KitAnimationFacade } from '../shared/three/kit-animation.facade';
import { KitTrajectoryFacade } from '../shared/three/kit-trajectory.facade';
import { DemoMessageSimulator } from '../shared/simulation/demo-message-simulator';
import { HubMessage } from '../shared/models/message.model';

describe('ThreeJSScenePureComponent', () => {
  let component: ThreeJSScenePureComponent;
  let fixture: ComponentFixture<ThreeJSScenePureComponent>;
  let trajectory: jasmine.SpyObj<KitTrajectoryFacade>;

  const mockSceneFacade = {
    initialize: jasmine.createSpy('initialize').and.resolveTo(undefined),
    getScene: jasmine.createSpy('getScene').and.returnValue(null),
    fps: of(60),
    onBeforeRender: new Subject<number>(),
    dispose: jasmine.createSpy('dispose'),
    reset: jasmine.createSpy('reset'),
    getRenderer: jasmine.createSpy('getRenderer').and.returnValue(null),
  };

  beforeEach(async () => {
    trajectory = jasmine.createSpyObj('KitTrajectoryFacade', [
      'setScene',
      'createMessageParticle',
      'updateParticles',
      'clearAllParticles',
      'getActiveParticleCount',
      'dispose',
    ]);

    await TestBed.configureTestingModule({
      imports: [ThreeJSScenePureComponent],
      providers: [
        { provide: KitSceneFacade, useValue: mockSceneFacade },
        { provide: KitAnimationFacade, useValue: { start: () => {}, update: () => {}, dispose: () => {}, getActiveAnimationCount: () => 0 } },
        { provide: KitTrajectoryFacade, useValue: trajectory },
        { provide: DemoMessageSimulator, useValue: { messages$: of(), start: () => {}, stop: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ThreeJSScenePureComponent);
    component = fixture.componentInstance;
  });

  it('should create without legacy AlephScript wiring', () => {
    expect(component).toBeTruthy();
  });

  it('should animate a message delivered via externalMessages$', async () => {
    const messages$ = new Subject<HubMessage>();
    component.externalMessages$ = messages$.asObservable();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    messages$.next({
      id: 'test-1',
      fromBot: 'KickBot-Alpha',
      toBot: 'CentralHub',
      channel: 'app',
      content: 'ping',
      timestamp: Date.now(),
      type: 'bot-to-center',
    });

    expect(trajectory.createMessageParticle).toHaveBeenCalled();
  });
});
