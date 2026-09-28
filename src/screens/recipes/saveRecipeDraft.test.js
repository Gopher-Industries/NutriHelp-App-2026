import saveRecipeDraft from './saveRecipeDraft';
import recipeIngredientRows from './recipeIngredientRows';
const form = () => ({ recipeName: 'Soup', cuisine: 'Italian', cookingMethod: 'Boil', cuisineOptions: [{id: 2, name: 'Italian'}], cookingMethodOptions: [{id: 3, name: 'Boil'}], timeMinutes: '20', servings: '2', steps: [{text: 'Cook.'}], ingredients: [{name: 'Tomato', ingredientId: 5, quantity: '100', unit: 'g', cost: ''}, {name: 'Basil', quantity: '', unit: '', sourceMeasure: 'sprinkling', notes: 'sprinkling'}] });
test('reuses matched IDs and creates only missing ingredients, preserving measures', async () => {
 const createRecipe=jest.fn();const resolveIngredients=jest.fn(async()=>[{name:'Basil',id:6,status:'created'}]);
 await saveRecipeDraft(form(),{createRecipe,resolveIngredients});
 expect(resolveIngredients).toHaveBeenCalledWith([{name:'Basil'}]);
 expect(createRecipe).toHaveBeenCalledWith(expect.objectContaining({ingredient_id:[5,6],ingredient_quantity:[100,null],ingredient_unit:['g',''],ingredient_source_measure:['','sprinkling']}));
 expect(createRecipe.mock.calls[0][0]).not.toHaveProperty('user_id');
});
test('resolution failure never drops an ingredient or saves a partial recipe', async()=>{
 const createRecipe=jest.fn();
 await expect(saveRecipeDraft(form(),{createRecipe,resolveIngredients:async()=>[{name:'Basil',id:null,status:'failed'}]})).rejects.toThrow('Could not add Basil');
 expect(createRecipe).not.toHaveBeenCalled();
});
test('invalid quantity and missing lookup IDs fail before any writes',async()=>{
 for(const change of [{cuisineOptions:[{name:'Italian'}]},{ingredients:[{name:'Oil',quantity:'1/4 cup'}]}]){
 const resolveIngredients=jest.fn(),createRecipe=jest.fn();
 await expect(saveRecipeDraft({...form(),...change},{resolveIngredients,createRecipe})).rejects.toThrow();
 expect(resolveIngredients).not.toHaveBeenCalled();expect(createRecipe).not.toHaveBeenCalled();
 }
});
test('save errors propagate and leave the draft unchanged',async()=>{
 const draft=form();const snapshot=JSON.stringify(draft);
 await expect(saveRecipeDraft(draft,{resolveIngredients:async()=>[{name:'Basil',id:6,status:'matched'}],createRecipe:async()=>{throw new Error('Offline')}})).rejects.toThrow('Offline');
 expect(JSON.stringify(draft)).toBe(snapshot);
});
test('stored measurements display with units or the original qualitative measure',()=>{
 expect(recipeIngredientRows({id:[5,6],name:['Oil','Salt'],quantity:[0.25,null],unit:['cups',''],source_measure:['1/4 cup','To taste']})).toEqual([{ingredientId:5,name:'Oil',quantity:0.25,unit:'cups'},{ingredientId:6,name:'Salt',quantity:'To taste',unit:''}]);
});
