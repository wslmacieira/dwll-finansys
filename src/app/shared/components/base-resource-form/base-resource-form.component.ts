import { OnInit, AfterContentChecked, Injector, Directive } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

import { BaseResourceModel } from '../../models/base-resource.model'
import { BaseResourceService } from '../../services/base-resource.service'

import { switchMap } from "rxjs/operators";

import * as toastr from "toastr";

@Directive()
export abstract class BaseResourceFormComponent<T extends BaseResourceModel> implements OnInit, AfterContentChecked {

  currentAction: string = '';
  resourceForm: FormGroup = new FormGroup({});
  pageTitle: string = '';
  serverErrorMessages: string[] = [];
  submittingForm: boolean = false;

  protected route: ActivatedRoute;
  protected router: Router;
  protected formBuilder: FormBuilder;

  constructor(
    protected injector: Injector,
    public resource: T,
    protected resourceService: BaseResourceService<T>,
    protected jsonDataToResource: (jsonData: any) => T
  ) {
    this.route = this.injector.get(ActivatedRoute);
    this.router = this.injector.get(Router);
    this.formBuilder = this.injector.get(FormBuilder);
  }

  ngOnInit(): void {
    this.setCurrentAction();
    this.buildResourceForm();
    this.loadResource();
  }

  ngAfterContentChecked(): void {
    this.setPageTitle();
  }

  submitForm() {
    this.submittingForm = true;
    if(this.currentAction == 'new') {
      this.createResource();
    } else {
      this.updateResource();
    }
  }

  // PROTECTED MÉTHODS

  protected setCurrentAction() {
    if(this.route.snapshot.url[0].path == "new"){
      this.currentAction = "new"
    } else {
      this.currentAction = "edit"
    }
  }

  protected loadResource() {
    if (this.currentAction === "edit") {

      this.route.paramMap.pipe(
        switchMap(params => this.resourceService.getById(Number(params.get("id"))))
      )
      .subscribe(
        (resource) => {
          this.resource = resource;
          this.resourceForm.patchValue(resource) // binds loaded resource data to resourceForm
        },
        (error) => alert('Ocorreu um erro no servidor, tente mais tarde.')
      )
    }
  }

  protected setPageTitle() {
    if (this.currentAction == 'new') {
      this.pageTitle = this.creationPageTitle();
    } else {
      this.pageTitle = this.editionPageTitle();
    }
  }

  protected creationPageTitle(): string {
    return 'Novo';
  }

  protected editionPageTitle(): string {
    return 'Edição';
  }

  protected createResource() {
    const resource: T = this.jsonDataToResource(this.resourceForm.value);

    this.resourceService.create(resource).subscribe(
      (resource) => this.actionsForSuccess(resource),
      (error) => this.actionsForError(error)
    )
  }

  protected updateResource() {
    const resource: T = this.jsonDataToResource(this.resourceForm.value);

    this.resourceService.update(resource).subscribe(
      (resource) => this.actionsForSuccess(resource),
      (error) => this.actionsForError(error)
    )
  }

  protected actionsForSuccess(resource: T) {
    toastr.success("Solicitação processada com sucesso!");

    const baseComponentPath: string  = this.route.snapshot.parent?.url[0].path ?? '';

    // redirect/reload component page
    this.router.navigateByUrl(baseComponentPath, {skipLocationChange: true}).then(
      () => this.router.navigate([baseComponentPath, resource.id, 'edit'])
    )
  }

  protected actionsForError(error: any) {
    toastr.error("Ocorreu um erro ao processar a solicitação!");

    this.submittingForm = false;

    if(error.status === 422) {
      this.serverErrorMessages = JSON.parse(error._body).errors;
    } else {
      this.serverErrorMessages = ["Falha na comunicação com servidor. Por favor, tente mais tarde."]
    }
  }

  protected abstract buildResourceForm(): void;

}
