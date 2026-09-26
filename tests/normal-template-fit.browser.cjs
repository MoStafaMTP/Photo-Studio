// Requires Playwright for tests only; optional environment paths reuse an installed runtime.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {}),headless:true,args:['--allow-file-access-from-files']});
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  try {
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    const result=await page.evaluate(async () => {
      const checks=[]; window.normalFitChecks=checks;
      const assert=(name,condition)=>{if(!condition)throw new Error(name);checks.push(name);};
      const near=(a,b)=>Math.abs(a-b)<.001;
      const source=document.createElement('canvas');source.width=500;source.height=800;
      const s=source.getContext('2d');s.fillStyle='#fff';s.fillRect(0,0,500,800);
      s.fillStyle='#635749';s.beginPath();s.moveTo(190,40);s.lineTo(310,40);s.lineTo(450,760);s.lineTo(50,760);s.closePath();s.fill();
      const blob=await new Promise(resolve=>source.toBlob(resolve));listingAutoPrompted=true;
      addImages([new File([blob],'details.png',{type:'image/png'}),new File([blob],'Close View.png',{type:'image/png'}),new File([blob],'DT.png',{type:'image/png'})]);
      await Promise.all(files.map(item=>item.image.decode()));
      listingAccount.value='6';listingMaterial.value='genuine-leather-solid';await applyListingWatermarks();
      const item=files.find(item=>item.file.name==='details.png'), close=files.find(item=>item.file.name==='Close View.png'), main=files.find(item=>item.file.name==='DT.png');
      const baseline=()=>{
        const bounds=item.smartPrep.bounds,r=smartSafeRect(item.smartPrep),fit=Math.min(r.width/bounds.width,r.height/bounds.height);
        return {x:r.x+r.width/2,y:r.y+r.height/2,width:bounds.width*fit,height:bounds.height*fit};
      };
      // Independently check the actual exported-pixel silhouette against every
      // header-art pixel within 49px. This is stricter than a 50px Euclidean gap.
      function clearanceViolations(geometry) {
        const headerRows=Math.min(canvas.height,Math.ceil(Math.max(smartSafeRect(item.smartPrep).y,canvas.height*.25)));
        const rows=Math.min(canvas.height,headerRows+50),width=canvas.width;
        const product=document.createElement('canvas');product.width=width;product.height=rows;
        const p=product.getContext('2d'),bounds=item.smartPrep.bounds;
        p.translate(geometry.x,geometry.y);p.rotate((item.rotation||0)*Math.PI/180);p.scale(item.mirror?-1:1,item.flipY?-1:1);
        const drawWidth=geometry.drawWidth||geometry.width,drawHeight=geometry.drawHeight||geometry.height;
        p.drawImage(item.smartPrep.foreground,bounds.x,bounds.y,bounds.width,bounds.height,-drawWidth/2,-drawHeight/2,drawWidth,drawHeight);
        const overlay=document.createElement('canvas');overlay.width=width;overlay.height=headerRows;
        const o=overlay.getContext('2d'),cover=Math.max(width/item.watermarkImage.naturalWidth,canvas.height/item.watermarkImage.naturalHeight);
        const ww=item.watermarkImage.naturalWidth*cover,wh=item.watermarkImage.naturalHeight*cover;
        o.drawImage(item.watermarkImage,(width-ww)/2,(canvas.height-wh)/2,ww,wh);
        const a=p.getImageData(0,0,width,rows).data,b=o.getImageData(0,0,width,headerRows).data;
        const stride=width+1,integral=new Uint32Array(stride*(headerRows+1));
        for(let y=0;y<headerRows;y++) {
          let sum=0;
          for(let x=0;x<width;x++) {
            sum+=b[(y*width+x)*4+3]>16?1:0;
            integral[(y+1)*stride+x+1]=integral[y*stride+x+1]+sum;
          }
        }
        let count=0;
        for(let y=0;y<rows;y++)for(let x=0;x<width;x++) {
          if(a[(y*width+x)*4+3]<=16)continue;
          const left=Math.max(0,x-49),right=Math.min(width,x+50),top=Math.max(0,y-49),bottom=Math.min(headerRows,y+50);
          if(top>=bottom)continue;
          if(integral[bottom*stride+right]-integral[top*stride+right]-integral[bottom*stride+left]+integral[top*stride+left]>0)count++;
        }
        return count;
      }
      const results=[];
      for(let section=0;section<7;section++) {
        const template=findListingTemplate(section,'Normal').template;
        item.watermarkImage=await loadListingTemplateImage(section,template);item.watermarkSection=section;item.watermarkTemplateId=template.id;
        item.smartPrep.safeArea=await getWatermarkSafeArea(section,template,item.watermarkImage);
        const before=baseline(),after=smartProductGeometry(item),growth=after.height/before.height;
        const beforeOverlap=clearanceViolations(before),afterOverlap=clearanceViolations(after);
        assert(watermarkSections[section].name+': modest enlargement into clear top space',growth>1.005&&growth<=1.08001&&after.y-after.height/2<before.y-before.height/2);
        assert(watermarkSections[section].name+': proportions, canvas bounds and bottom margin preserved',near(after.width/after.height,before.width/before.height)&&near(after.x,canvas.width/2)&&after.x-after.width/2>=50&&after.x+after.width/2<=canvas.width-50&&after.y+after.height/2<=before.y+before.height/2+.001);
        assert(watermarkSections[section].name+': at least 50px from header artwork at native pixel resolution',afterOverlap===0);
        results.push({account:watermarkSections[section].name,growthPercent:Math.round((growth-1)*1000)/10,topBefore:Math.round(before.y-before.height/2),topAfter:Math.round(after.y-after.height/2),clearanceViolationsBefore:beforeOverlap,clearanceViolationsAfter:afterOverlap});
      }
      for(const [width,height] of [[2000,2000],[1200,1600],[1600,1200]]) {
        canvas.width=width;canvas.height=height;
        for(let section=0;section<7;section++) {
          const template=findListingTemplate(section,'Normal').template;
          item.watermarkImage=await loadListingTemplateImage(section,template);item.watermarkSection=section;item.watermarkTemplateId=template.id;
          item.smartPrep.safeArea=await getWatermarkSafeArea(section,template,item.watermarkImage);
          const geometry=smartProductGeometry(item);
          assert(watermarkSections[section].name+': 50px header clearance at '+width+'x'+height,clearanceViolations(geometry)===0&&near(geometry.x,width/2));
        }
      }
      canvas.width=canvas.height=1576;
      for(const transform of [{rotation:15},{mirror:true},{flipY:true}]) {
        Object.assign(item,transform);
        assert('Transformed silhouette keeps 50px header clearance: '+JSON.stringify(transform),clearanceViolations(smartProductGeometry(item))===0);
        item.rotation=0;item.mirror=false;item.flipY=false;
      }
      const narrow=item.smartPrep;
      const wide=document.createElement('canvas');wide.width=400;wide.height=320;wide.getContext('2d').fillRect(0,0,400,320);
      item.smartPrep={...narrow,foreground:wide,bounds:{x:0,y:0,width:400,height:320}};
      const wideBefore=baseline(),wideAfter=smartProductGeometry(item);
      assert('Wide product stays vertically centered without crowding corner logos or losing bottom clearance',near(wideAfter.y,wideBefore.y)&&clearanceViolations(wideAfter)===0&&wideAfter.y+wideAfter.height/2<=wideBefore.y+wideBefore.height/2+.001);
      item.smartPrep=narrow;
      const area=item.smartPrep.safeArea,before=baseline();item.smartPrep.safeArea={...area,source:'custom'};
      assert('Explicit custom top margin is respected',near(smartProductGeometry(item).y,before.y)&&near(smartProductGeometry(item).height,before.height));item.smartPrep.safeArea=area;
      const ordinary=smartSafeRect(main.smartPrep),m=smartProductGeometry(main),b=main.smartPrep.bounds,fit=Math.min(ordinary.width/b.width,ordinary.height/b.height);
      assert('Main template geometry stays unchanged',near(m.height,b.height*fit)&&near(m.y,ordinary.y+ordinary.height/2));
      assert('Close View stays native with its original background',!close.smartPrep&&close.originalSize&&!close.removeBg&&getBaseLayerRect(close).width===500&&getBaseLayerRect(close).height===800);
      const full=smartProductGeometry(item);item.scale=120;item.offsetX=30;item.offsetY=-20;const adjusted=smartProductGeometry(item);
      assert('Manual scaling and dragging use the cached automatic layout',near(adjusted.height,full.height*1.2)&&near(adjusted.x,full.x+30)&&near(adjusted.y,full.y-20));item.scale=100;item.offsetX=item.offsetY=0;
      item.rotation=180;const rotated=smartProductGeometry(item);
      assert('Rotated product stays on canvas',rotated.y-rotated.height/2>=0&&rotated.y+rotated.height/2<=canvas.height);item.rotation=0;
      item.smartPrep.mode='fallback';const fallback=smartProductGeometry(item);
      assert('Uncertain foreground detection retains the ordinary safe fit',near(fallback.height,baseline().height));item.smartPrep.mode='separated';
      // Test a full-width top banner under an actual Normal template name.
      const banner=document.createElement('canvas');banner.width=banner.height=1500;const bc=banner.getContext('2d');bc.fillStyle='#f00';bc.fillRect(0,0,1500,130);
      const bannerImage=await loadWatermark(new Blob([await (await fetch(banner.toDataURL())).arrayBuffer()],{type:'image/png'}));
      item.watermarkImage=bannerImage;item.smartPrep.safeArea={canvasWidth:1500,canvasHeight:1500,topMargin:180,bottomMargin:120,source:'template',clearance:0};
      const constrained=smartProductGeometry(item);
      assert('Normal full-width banner caps upward growth before artwork',constrained.y-constrained.height/2>=130/1500*canvas.height+50&&clearanceViolations(constrained)===0);
      selectImage(files.indexOf(item));const real=findListingTemplate(6,'Normal').template;await selectWatermarkTemplate(6,real.id);
      const expected=smartProductGeometry(item),png=await createImageBitmap(await createExportBlob(item,'png'));
      assert('Production export keeps canvas size and adapted geometry',png.width===1576&&png.height===1576&&near(smartProductGeometry(item).height,expected.height));
      // Export a before/after visual using the production renderer.
      const current=item.smartPrep.safeArea;item.smartPrep.safeArea={...current,source:'custom'};
      const beforeBlob=await createExportBlob(item,'png');item.smartPrep.safeArea=current;
      const afterBlob=await createExportBlob(item,'png');
      const encode=blob=>new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob);});
      return {checks,results,before:await encode(beforeBlob),after:await encode(afterBlob)};
    });
    if(process.env.NORMAL_FIT_PREVIEW) {
      await page.setContent(`<body style="margin:0;background:#e5e5ea;font:20px Arial;display:flex;gap:20px;padding:20px"><section>Before<br><img width="650" src="${result.before}"></section><section>After<br><img width="650" src="${result.after}"></section></body>`);
      await page.screenshot({path:process.env.NORMAL_FIT_PREVIEW});
    }
    if(errors.length)throw new Error(errors.join(';'));
    console.log(JSON.stringify({passed:result.checks.length,checks:result.checks,measurements:result.results,errors},null,2));
  } catch(error) {console.log(JSON.stringify({error:error.stack,passed:await page.evaluate(()=>window.normalFitChecks||[]),errors},null,2));process.exitCode=1;}
  finally {await browser.close();}
})();
