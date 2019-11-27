import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SpeechRecognizerService } from './shared/services/speech-recognizer.service';

import { SpeechNotification } from './shared/model/speech-notification';
import { SpeechError } from './shared/model/speech-error';
import { ActionContext } from './shared/model/strategy/action-context';

@Component({
  selector: 'wsa-web-speech',
  templateUrl: './web-speech.component.html',
  styleUrls: ['./web-speech.component.css']
})
export class WebSpeechComponent implements OnInit {

  finalTranscript = '';
  nombreTranscript = '';
  recognizing = false;
  notification: string;
  languages: string[] =  ['en-US', 'es-ES', 'es-CL'];
  currentLanguage: string;
  actionContext: ActionContext = new ActionContext();

  constructor(private changeDetector: ChangeDetectorRef,
              private speechRecognizer: SpeechRecognizerService) { }

  ngOnInit() {
    this.currentLanguage = this.languages[2];
    this.speechRecognizer.initialize(this.currentLanguage);
    this.initRecognition();
    this.notification = null;
  }

  startButton(event) {
    if (this.recognizing) {
      this.speechRecognizer.stop();
      return;
    }

    this.speechRecognizer.start(event.timeStamp);
  }

  onSelectLanguage(language: string) {
    this.currentLanguage = language;
    this.speechRecognizer.setLanguage(this.currentLanguage);
  }

  private initRecognition() {
    this.speechRecognizer.onStart()
      .subscribe(data => {
        this.recognizing = true;
        this.notification = 'Escucahndo, empieza a hablar...';
        this.detectChanges();
      });

    this.speechRecognizer.onEnd()
      .subscribe(data => {
        this.recognizing = false;
        this.detectChanges();
        this.notification = null;
      });

    this.speechRecognizer.onResult()
      .subscribe((data: SpeechNotification) => {
        const message = data.content.trim();
        if (data.info === 'final_transcript' && message.length > 0) {
          this.finalTranscript = `${this.finalTranscript}\n${message}`;
          this.actionContext.processMessage(message, this.currentLanguage);
          this.detectChanges();
          this.actionContext.runAction(message, this.currentLanguage);
        }
      });

    this.speechRecognizer.onError()
      .subscribe(data => {
        switch (data.error) {
          case SpeechError.BLOCKED:
          case SpeechError.NOT_ALLOWED:
            this.notification = `No se puede correr el demo.
            Debes dar autorización para acceder a tu micrófono`;
            break;
          case SpeechError.NO_SPEECH:
            this.notification = `El api de reconocimiento de voz no esta actica `;
            break;
          case SpeechError.NO_MICROPHONE:
            this.notification = `El micrófono no esta disponible`;
            break;
          default:
            this.notification = null;
            break;
        }
        this.recognizing = false;
        this.detectChanges();
      });
  }

  detectChanges() {
    this.changeDetector.detectChanges();
  }
}
