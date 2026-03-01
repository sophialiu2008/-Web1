import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    type?: string;
    url?: string;
    image?: string;
}

export default function SEO({
    title = '宠物领养中心 - 给流浪动物一个温暖的家',
    description = '在这里，每一只宠物都在等待一个温暖的家。选择领养，选择用爱改变生命。浏览成百上千只等待领养的狗狗和猫咪，让爱心传递。',
    type = 'website',
    url,
    image = '/images/hero-pets.jpg',
}: SEOProps) {
    const absoluteUrl = url ? `${window.location.origin}${url}` : window.location.href;
    const absoluteImageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`;

    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={absoluteUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={absoluteImageUrl} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={absoluteUrl} />
            <meta property="twitter:title" content={title} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={absoluteImageUrl} />
        </Helmet>
    );
}
