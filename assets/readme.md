# Typeform intergration

1. Go to the [My Account Page](https://admin.typeform.com/account#/section/user){:target="_blank"} and get the API KEY
2. Paste it in the settings pane and save
3. Then choose form you want to fetch responses from, save settings
4. Configure the mapping, choose which fields you want to save

To reconcile user Identities, you can setup your Typeform's to embed [Hidden Fields](https://www.typeform.com/help/hidden-fields/). We recognize the following fields automatically:

-`anonymousId` - The User's anonymous ID. Use this to reconcile to anonymous web traffic.
-`externalId` - The User's Id in your own database
-`hullId` - The User's Hull Id
-`email` - The user's email (overridable in settings)
