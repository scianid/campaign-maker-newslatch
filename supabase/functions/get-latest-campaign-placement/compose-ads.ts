/*
    public final String creativeId;
    public final String campaignId;
    public final String adm; --> HTML
    public final int width;
    public final int height;
    public final String mimeType; "text/html"
    public final String language; "en"

    public final String previewUrl; >> NTH
    public final List<String> advertiserDomains; >> NTH
    public final String adId; >> NTH
*/
import { ad300x250Template, ad300by100Template } from "./ad-templates.ts";

export const generateAdHtml = ({
    title,
    description,
    campaignId,
    creativeId,
    image_url,
    click_url,
    cta = "Learn More"
}: {
    title: string,
    description: string,
    campaignId: string,
    creativeId: string,
    image_url: string,
    click_url: string,
    cta?: string
}) => {
    const ads = [
        {
            width: "300",
            height: "250",
            templateMaker: ad300x250Template
        }, {
            width: "300",
            height: "100",
            templateMaker: ad300by100Template
        }
    ]

    return ads.map(ad => {
        return {
            campaignId,
            creativeId,
            width: ad.width,
            height: ad.height,
            adm: ad.templateMaker({
                title,
                description,
                image_url,
                click_url,
                cta
            }),
            mimeType: "text/html",
            language: "en",
        }
    })
}

