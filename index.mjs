import express from 'express';
import fetch from 'node-fetch';
import { create } from 'xmlbuilder2';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/lichess-stats/:username', async (req, res) => {
    const { username } = req.params;
    console.log(`Fetching data for user: ${username}`);

    try {
        const response = await fetch(`https://lichess.org/api/user/${username}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data for user: ${username}`);
        }
        const data = await response.json();
        console.log('Data fetched successfully:', data);

        const seenAt = new Date(data.seenAt || Date.now());
        const now = new Date();
        const timeDiff = now - seenAt;

        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60)) / 1000 / 60);

        const onlineStatusColor = (days === 0 && hours === 0 && minutes <= 5) ? '#4caf50' : '#9e9e9e';
        const onlineStatusText = (days === 0 && hours === 0 && minutes <= 5) ? 'Online' : `Online: ${days} days, ${hours} h, and ${minutes} min ago`;

        const svg = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 600, height: 350, style: 'border-radius: 9px; background-color: #1e1e1e; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);' })
                .ele('style')
                    .txt(`
                        text {
                            font-family: 'Roboto Condensed', sans-serif;
                            fill: #f5f5f5;
                        }
                        .header {
                            font-size: 26px;
                            font-weight: bold;
                            text-anchor: middle;
                        }
                        .subheader {
                            font-size: 18px;
                            text-anchor: middle;
                        }
                        .content {
                            font-size: 16px;
                        }
                        .graph {
                            fill: #4caf50;
                            rx: 10;
                            ry: 10;
                        }
                        .border-box {
                            stroke: #4a4a4a;
                            stroke-width: 2;
                            fill: none;
                            rx: 9;
                            ry: 9;
                        }
                        .status-dot {
                            fill: ${onlineStatusColor};
                        }
                    `).up()
                .ele('rect', { width: '100%', height: '100%', fill: '#1e1e1e', rx: 9, ry: 9 }).up()
                .ele('rect', { x: 10, y: 10, width: 580, height: 330, class: 'border-box' }).up()
                .ele('text', { x: 300, y: 50, class: 'header' })
                    .txt(`⚜️${data.username}⚜️`).up()
                .ele('circle', { cx: 570, cy: 30, r: 10, class: 'status-dot' }).up()
                .ele('text', { x: 300, y: 80, class: 'subheader' })
                    .txt(`${onlineStatusText}`).up()
                .ele('text', { x: 50, y: 150, class: 'content' })
                    .txt(`🧠Rapid: ${data.perfs?.rapid?.rating || 'N/A'}`).up()
                .ele('rect', { x: 180, y: 140, width: 0, height: 20, class: 'graph' })
                    .ele('animate', { attributeName: 'width', from: 0, to: `${data.perfs?.rapid?.rating / 3000 * 400 || 0}`, dur: '0.5s', fill: 'freeze' }).up().up()
                .ele('text', { x: 50, y: 200, class: 'content' })
                    .txt(`🔥Blitz: ${data.perfs?.blitz?.rating || 'N/A'}`).up()
                .ele('rect', { x: 180, y: 190, width: 0, height: 20, class: 'graph' })
                    .ele('animate', { attributeName: 'width', from: 0, to: `${data.perfs?.blitz?.rating / 3000 * 400 || 0}`, dur: '0.5s', fill: 'freeze' }).up().up()
                .ele('text', { x: 50, y: 250, class: 'content' })
                    .txt(`⚡Bullet: ${data.perfs?.bullet?.rating || 'N/A'}`).up()
                .ele('rect', { x: 180, y: 240, width: 0, height: 20, class: 'graph' })
                    .ele('animate', { attributeName: 'width', from: 0, to: `${data.perfs?.bullet?.rating / 3000 * 400 || 0}`, dur: '0.5s', fill: 'freeze' }).up().up()
            .end({ prettyPrint: true });

        console.log('SVG generated successfully:', svg);

        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(svg);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
