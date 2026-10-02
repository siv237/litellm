(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,972520,e=>{"use strict";let t=(0,e.i(475254).default)("arrow-right",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);e.s(["ArrowRight",0,t],972520)},411929,e=>{"use strict";var t=e.i(843476),r=e.i(271645),a=e.i(972520),s=e.i(174886),i=e.i(519455),d=e.i(515288),o=e.i(624687),n=e.i(571303),l=e.i(602869),c=e.i(417385);let m=({accessToken:e})=>{let[m,u]=(0,r.useState)(`{
  "model": "openai/gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Explain quantum computing in simple terms"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 500,
  "stream": true
}`),[p,x]=(0,r.useState)(""),[f,g]=(0,r.useState)(!1),h=async()=>{g(!0);try{let s;try{s=JSON.parse(m)}catch(e){c.toast.fromError("Некорректный JSON в теле запроса"),g(!1);return}let i={call_type:"completion",request_body:s};if(!e){c.toast.fromError("Токен доступа не найден"),g(!1);return}let d=await (0,l.transformRequestCall)(e,i);if(d.raw_request_api_base&&d.raw_request_body){var t,r,a;let e,s,i=(t=d.raw_request_api_base,r=d.raw_request_body,a=d.raw_request_headers||{},e=JSON.stringify(r,null,2).split("\n").map(e=>`  ${e}`).join("\n"),s=Object.entries(a).map(([e,t])=>`-H '${e}: ${t}'`).join(" \\\n  "),`curl -X POST \\
  ${t} \\
  ${s?`${s} \\
  `:""}-H 'Content-Type: application/json' \\
  -d '{
${e}
  }'`);x(i),c.toast.success("Запрос преобразован")}else{let e="string"==typeof d?d:JSON.stringify(d);x(e),c.toast.info("Преобразованный запрос получен в неожиданном формате")}}catch(e){console.error("Error transforming request:",e),c.toast.fromError("Не удалось преобразовать запрос")}finally{g(!1)}};return(0,t.jsxs)("div",{className:"p-2",children:[(0,t.jsx)("h1",{className:"text-lg font-medium text-foreground",children:"Playground"}),(0,t.jsx)("p",{className:"text-sm text-muted-foreground",children:"Посмотрите, как ruLiteLLM преобразует ваш запрос для выбранного провайдера."}),(0,t.jsxs)("div",{className:"mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2",children:[(0,t.jsxs)(d.Card,{children:[(0,t.jsxs)(d.CardHeader,{children:[(0,t.jsx)(d.CardTitle,{className:"text-2xl font-bold",children:"Исходный запрос"}),(0,t.jsx)(d.CardDescription,{children:"Запрос, который вы отправили бы на эндпоинт ruLiteLLM /chat/completions."})]}),(0,t.jsx)(d.CardContent,{children:(0,t.jsx)(o.Textarea,{className:"h-72 resize-none p-4 font-mono text-sm field-sizing-fixed",value:m,onChange:e=>u(e.target.value),onKeyDown:e=>{(e.metaKey||e.ctrlKey)&&"Enter"===e.key&&(e.preventDefault(),h())},placeholder:"Нажмите Cmd/Ctrl + Enter для преобразования"})}),(0,t.jsx)(d.CardFooter,{className:"justify-end",children:(0,t.jsxs)(i.Button,{onClick:h,disabled:f,children:[(0,t.jsx)("span",{children:"Преобразовать"}),f?(0,t.jsx)(n.UiLoadingSpinner,{className:"size-4"}):(0,t.jsx)(a.ArrowRight,{})]})})]}),(0,t.jsxs)(d.Card,{children:[(0,t.jsxs)(d.CardHeader,{children:[(0,t.jsx)(d.CardTitle,{className:"text-2xl font-bold",children:"Преобразованный запрос"}),(0,t.jsx)(d.CardDescription,{children:"Как ruLiteLLM преобразует ваш запрос для выбранного провайдера."}),(0,t.jsx)("p",{className:"mt-2 text-xs text-muted-foreground",children:"Примечание: чувствительные заголовки не показаны."})]}),(0,t.jsx)(d.CardContent,{children:(0,t.jsxs)("div",{className:"relative rounded-md bg-muted",children:[(0,t.jsx)("pre",{className:"h-72 overflow-auto p-4 font-mono text-sm",children:p||`curl -X POST \\
  https://api.openai.com/v1/chat/completions \\
  -H 'Authorization: Bearer sk-xxx' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    }
  ],
  "temperature": 0.7
  }'`}),(0,t.jsx)(i.Button,{variant:"ghost",size:"icon-sm","aria-label":"Копировать в буфер",className:"absolute top-2 right-2",onClick:()=>{navigator.clipboard.writeText(p||""),c.toast.success("Скопировано в буфер")},children:(0,t.jsx)(s.Copy,{})})]})})]})]}),(0,t.jsx)("div",{className:"mt-4 text-right",children:(0,t.jsxs)("p",{className:"text-sm text-muted-foreground",children:["Нашли ошибку? Создайте issue"," ",(0,t.jsx)("a",{className:"underline underline-offset-4",href:"https://github.com/BerriAI/litellm/issues",target:"_blank",rel:"noopener noreferrer",children:"here"}),"."]})})]})};var u=e.i(135214);e.s(["default",0,function(){let{accessToken:e}=(0,u.default)();return(0,t.jsx)(m,{accessToken:e})}],411929)},515288,e=>{"use strict";var t=e.i(843476),r=e.i(271645),a=e.i(196631);let s=r.forwardRef(({className:e,size:r="default",...s},i)=>(0,t.jsx)("div",{ref:i,"data-slot":"card","data-size":r,className:(0,a.cn)("group/card flex flex-col gap-(--card-spacing) rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground shadow-xs ring-1 ring-foreground/10 [--card-spacing:--spacing(6)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",e),...s}));s.displayName="Card";let i=r.forwardRef(({className:e,...r},s)=>(0,t.jsx)("div",{ref:s,"data-slot":"card-header",className:(0,a.cn)("group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",e),...r}));i.displayName="CardHeader";let d=r.forwardRef(({className:e,...r},s)=>(0,t.jsx)("div",{ref:s,"data-slot":"card-title",className:(0,a.cn)("text-base leading-normal font-medium group-data-[size=sm]/card:text-sm",e),...r}));d.displayName="CardTitle";let o=r.forwardRef(({className:e,...r},s)=>(0,t.jsx)("div",{ref:s,"data-slot":"card-description",className:(0,a.cn)("text-sm text-muted-foreground",e),...r}));o.displayName="CardDescription";let n=r.forwardRef(({className:e,...r},s)=>(0,t.jsx)("div",{ref:s,"data-slot":"card-action",className:(0,a.cn)("col-start-2 row-span-2 row-start-1 self-start justify-self-end",e),...r}));n.displayName="CardAction";let l=r.forwardRef(({className:e,...r},s)=>(0,t.jsx)("div",{ref:s,"data-slot":"card-content",className:(0,a.cn)("px-(--card-spacing)",e),...r}));l.displayName="CardContent";let c=r.forwardRef(({className:e,...r},s)=>(0,t.jsx)("div",{ref:s,"data-slot":"card-footer",className:(0,a.cn)("flex items-center rounded-b-xl px-(--card-spacing) [.border-t]:pt-(--card-spacing)",e),...r}));c.displayName="CardFooter",e.s(["Card",0,s,"CardAction",0,n,"CardContent",0,l,"CardDescription",0,o,"CardFooter",0,c,"CardHeader",0,i,"CardTitle",0,d])}]);